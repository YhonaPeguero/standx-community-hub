"use client";

import {AnimatePresence, motion, useReducedMotion} from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import {usePathname, useRouter} from "next/navigation";
import {useTranslations} from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from "react";
import HologramStage, {
  type HologramHandle,
  type HologramMotionPreference
} from "@/components/agent/HologramStage";
import {useAgentChat} from "@/components/agent/useAgentChat";
import {useSpeech} from "@/components/agent/useSpeech";
import type {AppLocale} from "@/i18n/request";
import {
  agentHintVariants,
  agentMotion,
  agentMotionReduced,
  agentTurnVariants
} from "@/lib/motion";
import type {HologramMood} from "@/lib/hologram-scene";
import type {MotionTrigger} from "@/lib/mascot/motion";
import type {AgentNavigation} from "@/lib/agent/types";

interface StandxAgentProps {
  locale: AppLocale;
}

const SUGGESTION_KEYS = ["one", "two", "three", "four"] as const;
const HINT_STORAGE_KEY = "standx-hub-agent-hint";
const MOTION_STORAGE_KEY = "standx-hub-agent-motion";
const VOICE_FEATURES_ENABLED = process.env.NEXT_PUBLIC_STANDER_VOICE === "1";
const ANSWER_GESTURE_MIN_MS = 700;
const ANSWER_GESTURE_MAX_MS = 1200;
/** Long enough to read "Opening: X" before the projection stands down. */
const NAVIGATE_CLOSE_DELAY_MS = 1100;

/** Strips the locale prefix so the route matches what the agent's map uses. */
function routeFromPathname(pathname: string, locale: AppLocale): string {
  const withoutLocale = pathname.replace(new RegExp(`^/${locale}`), "");
  return withoutLocale.replace(/^\/+|\/+$/g, "");
}

export default function StandxAgent({locale}: StandxAgentProps) {
  const t = useTranslations("agent");
  const router = useRouter();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  // Stays true through the overlay's exit animation. The dock waits on this
  // rather than on `open`, otherwise it mounts a second WebGL context while the
  // overlay's is still on screen.
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answerGestureActive, setAnswerGestureActive] = useState(false);
  // Animated by default. `system` meant a visitor whose OS reports
  // prefers-reduced-motion met a frozen mascot and had to go find a control to
  // turn it on, which is not a first impression worth defending. The pause
  // control is still one click away and the choice persists.
  const [avatarMotionPreference, setAvatarMotionPreference] =
    useState<HologramMotionPreference>("full");

  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Two stages exist at different times (dock, chamber) but never together, so
  // one handle each and a helper that talks to whichever is mounted.
  const dockAvatarRef = useRef<HologramHandle | null>(null);
  const chamberAvatarRef = useRef<HologramHandle | null>(null);
  const interestDecayRef = useRef<number | null>(null);
  const spokenRef = useRef<string | null>(null);
  const gesturedAnswerRef = useRef<string | null>(null);
  const answerGestureTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const currentRoute = routeFromPathname(pathname, locale);

  /**
   * The character's reaction surface. Everything the visitor does routes
   * through here, so the widget never has to know which stage is mounted and
   * the reduced-motion preference is honoured in exactly one place.
   */
  const avatar = useMemo(() => {
    const live = (): HologramHandle | null =>
      chamberAvatarRef.current ?? dockAvatarRef.current;

    return {
      lookAt: (element: Element | null, weight = 1) =>
        live()?.lookAt(element, weight),
      beat: (event: MotionTrigger) => live()?.beat(event),
      /**
       * Raise arousal and let it fall back on its own. The widget signals that
       * something IS happening; it never has to remember to say it stopped,
       * which is the bug you get when every handler owns a teardown.
       */
      engage: (level = 1, holdMs = 2600) => {
        const handle = live();
        if (!handle) {
          return;
        }
        handle.setInterest(level);
        if (interestDecayRef.current !== null) {
          window.clearTimeout(interestDecayRef.current);
        }
        interestDecayRef.current = window.setTimeout(() => {
          interestDecayRef.current = null;
          live()?.setInterest(0);
        }, holdMs);
      }
    };
  }, []);
  const avatarMotionEnabled = avatarMotionPreference !== "reduced";

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MOTION_STORAGE_KEY);
      if (stored === "full" || stored === "reduced") {
        setAvatarMotionPreference(stored);
      }
    } catch {
      // Private mode: keep following the visitor's system preference.
    }
  }, []);

  const toggleAvatarMotion = useCallback(() => {
    setAvatarMotionPreference((current) => {
      const next: HologramMotionPreference =
        current === "reduced" ? "full" : "reduced";
      try {
        window.localStorage.setItem(MOTION_STORAGE_KEY, next);
      } catch {
        // The choice still applies for this session when storage is unavailable.
      }
      return next;
    });
  }, []);

  // The overlay covers the viewport, so staying open after a navigation would
  // hide the very page the visitor was sent to. Stand the projection down and
  // let them look; the transcript is preserved for when they reopen it.
  const handleNavigate = useCallback(
    (navigation: AgentNavigation) => {
      // Taking you there. The beat fires before the route change so the
      // movement reads as the cause of the navigation, not a reaction to it.
      avatar.beat("acknowledge");
      avatar.lookAt(null);
      router.push(navigation.href);
      closeTimerRef.current = window.setTimeout(() => {
        setOpen(false);
      }, NAVIGATE_CLOSE_DELAY_MS);
    },
    [avatar, router]
  );

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (answerGestureTimerRef.current !== null) {
        window.clearTimeout(answerGestureTimerRef.current);
      }
      if (interestDecayRef.current !== null) {
        window.clearTimeout(interestDecayRef.current);
      }
    };
  }, []);

  const {entries, status, errorKind, retryAfter, send, retry, reset, stop} =
    useAgentChat({
      locale,
      currentRoute,
      onNavigate: handleNavigate
    });

  const submitText = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) {
        return;
      }
      setOverlayMounted(true);
      setOpen(true);
      setNotice(null);
      setInput("");
      // Received. One downward beat before the thinking state takes over, so
      // the question visibly lands instead of just changing a status chip.
      avatar.beat("acknowledge");
      avatar.engage(1, 4000);
      void send(value);
    },
    [avatar, send]
  );

  const speech = useSpeech({
    enabled: VOICE_FEATURES_ENABLED,
    locale,
    onTranscript: submitText,
    onInterim: setInput,
    onUnsupported: () => setNotice(t("voiceUnsupported")),
    onDenied: () => setNotice(t("micDenied"))
  });

  const busy = status === "thinking" || status === "answering";
  const visualSpeaking =
    open && (speech.speaking || status === "answering" || answerGestureActive);

  const mood: HologramMood = useMemo(() => {
    if (speech.listening) return "listening";
    if (visualSpeaking) return "speaking";
    if (status === "thinking") return "thinking";
    return "idle";
  }, [speech.listening, status, visualSpeaking]);

  const statusLabel = useMemo(() => {
    if (speech.listening) return t("statusListening");
    if (speech.speaking) return t("statusSpeaking");
    if (status === "thinking") return t("statusThinking");
    if (status === "answering") return t("statusAnswering");
    if (status === "error") return t("statusError");
    return t("statusOnline");
  }, [speech.listening, speech.speaking, status, t]);

  const live = busy || speech.listening || speech.speaking;
  // "Online" is not useful conversation feedback. Keep the utility row out
  // of the empty state and surface status only while Stander is doing
  // something the visitor needs to understand (or when a request failed).
  const showActivity = status !== "idle" || speech.listening || speech.speaking;

  // Counts the server's retry-after down so the Retry button cannot fire
  // straight back into the same 429.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!retryAfter) {
      setCooldown(0);
      return;
    }
    setCooldown(retryAfter);
    const timer = window.setInterval(() => {
      setCooldown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  useEffect(() => {
    const last = entries[entries.length - 1];
    if (!last || last.role !== "assistant" || !last.complete) {
      return;
    }
    if (spokenRef.current === last.id) {
      return;
    }
    spokenRef.current = last.id;
    speech.speak(last.content);
  }, [entries, speech]);

  // A local knowledge answer can arrive in one network chunk, which used to
  // move the mascot through "speaking" too quickly for a human to see. Give
  // every successful answer a short, content-scaled performance window. The
  // motion engine owns the gestures; this only keeps the semantic mood alive.
  useEffect(() => {
    const last = entries[entries.length - 1];
    if (
      !open ||
      !last ||
      last.role !== "assistant" ||
      !last.complete ||
      last.failed ||
      !last.content
    ) {
      if (answerGestureTimerRef.current !== null) {
        window.clearTimeout(answerGestureTimerRef.current);
        answerGestureTimerRef.current = null;
      }
      setAnswerGestureActive(false);
      return;
    }

    // Streaming can replace the entries array once more after marking the
    // answer complete. Preserve the active timer for that same answer instead
    // of cancelling its performance window on the follow-up render.
    if (gesturedAnswerRef.current === last.id) {
      return;
    }

    if (answerGestureTimerRef.current !== null) {
      window.clearTimeout(answerGestureTimerRef.current);
    }

    gesturedAnswerRef.current = last.id;
    // Here you go. The nod punctuates the answer; the glance sends the eye to
    // the text the visitor is about to read.
    avatar.beat("nod");
    avatar.lookAt(transcriptRef.current, 0.5);
    avatar.engage(0.85, 3000);
    const duration = Math.min(
      ANSWER_GESTURE_MAX_MS,
      Math.max(ANSWER_GESTURE_MIN_MS, 500 + last.content.length)
    );
    setAnswerGestureActive(true);
    answerGestureTimerRef.current = window.setTimeout(() => {
      answerGestureTimerRef.current = null;
      setAnswerGestureActive(false);
    }, duration);
  }, [avatar, entries, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  }, [entries, open, prefersReducedMotion, status]);

  // Lock the page behind the overlay and wire Escape.
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Focus lands once the deck has finished sliding in — focusing mid-transition
  // makes the browser scroll the still-moving element and the whole thing jumps.
  useEffect(() => {
    if (!open) {
      return;
    }
    setShowHint(false);
    // The composer is where the visitor works, so that is where the character
    // looks once the chamber has settled. Same delay as the focus call: looking
    // at an element that is still sliding in points at where it used to be.
    const glance = window.setTimeout(
      () => avatar.lookAt(inputRef.current, 0.45),
      prefersReducedMotion ? 0 : 560
    );
    const timer = window.setTimeout(
      () => inputRef.current?.focus(),
      prefersReducedMotion ? 0 : 520
    );
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(glance);
    };
  }, [avatar, open, prefersReducedMotion]);

  // One-time nudge so first-time visitors notice the projection is interactive.
  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(HINT_STORAGE_KEY) === "seen";
    } catch {
      dismissed = true;
    }
    if (dismissed) {
      return;
    }

    const timer = window.setTimeout(() => setShowHint(true), 5200);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      window.localStorage.setItem(HINT_STORAGE_KEY, "seen");
    } catch {
      // Private mode — the hint simply reappears next session.
    }
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    submitText(input);
  };

  const openPanel = (): void => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    dismissHint();
    setOverlayMounted(true);
    setOpen(true);
  };

  const closePanel = (): void => {
    speech.cancelSpeech();
    setOpen(false);
  };

  // Safe to branch: this subtree only ever mounts after a click, so it never
  // server-renders and cannot produce a hydration mismatch. See AGENTS.md.
  const m = prefersReducedMotion ? agentMotionReduced : agentMotion;

  const latest = entries[entries.length - 1];
  const showTyping = status === "thinking" && latest?.role === "assistant" && !latest.content;

  return (
    <>
      <AnimatePresence onExitComplete={() => setOverlayMounted(false)}>
        {open ? (
          <motion.div
            key="agent-overlay"
            variants={m.overlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={t("dialogLabel")}
            className="agent-overlay"
          >
            <motion.button
              type="button"
              variants={m.scrim}
              className="agent-overlay__scrim"
              aria-label={t("close")}
              tabIndex={-1}
              onClick={closePanel}
            />

            <motion.div variants={m.mesh} className="agent-overlay__mesh" aria-hidden="true" />
            <div className="agent-overlay__vignette" aria-hidden="true" />

            {/* Drives the reflow in globals.css: the projection is the hero of
                the empty state and steps back once there is a conversation to
                read. */}
            <div className="agent-overlay__inner" data-conversing={entries.length > 0}>
              <motion.div variants={m.rail} className="agent-overlay__rail">
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label={t("close")}
                  className="agent-overlay__close"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  {/* A key name, not copy — the same three letters on every
                      keyboard, so it stays out of the message catalogue. */}
                  <span className="agent-overlay__esc" aria-hidden="true">
                    ESC
                  </span>
                </button>
              </motion.div>

              {/* The projection itself — the whole point of the takeover. */}
              <motion.div variants={m.stage} className="agent-overlay__stage">
                <HologramStage
                  mood={mood}
                  active
                  handleRef={chamberAvatarRef}
                  motionPreference={avatarMotionPreference}
                  trackPointer={avatarMotionEnabled}
                />
              </motion.div>

              <motion.div variants={m.deck} className="agent-console">
                {showActivity || entries.length > 0 ? (
                  <motion.div variants={m.row} className="agent-console__head">
                    {showActivity ? (
                      <span className="agent-console__status" data-live={live}>
                        <span
                          className={live ? "live-dot" : "agent-dot-static"}
                          aria-hidden="true"
                        />
                        <span aria-live="polite">{statusLabel}</span>
                      </span>
                    ) : null}

                    {entries.length > 0 ? (
                      <span className="agent-console__actions">
                        <button
                          type="button"
                          onClick={() => {
                            speech.cancelSpeech();
                            spokenRef.current = null;
                            reset();
                          }}
                          aria-label={t("newChat")}
                          title={t("newChat")}
                          className="agent-icon-btn"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    ) : null}
                  </motion.div>
                ) : null}

                <motion.div
                  variants={m.row}
                  className="agent-transcript"
                  ref={transcriptRef}
                  role="log"
                  data-empty={entries.length === 0 ? "true" : "false"}
                >
                  {entries.length === 0 ? (
                    <p className="agent-line agent-line--assistant">{t("greeting")}</p>
                  ) : null}

                  {entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      variants={prefersReducedMotion ? undefined : agentTurnVariants}
                      initial={prefersReducedMotion ? undefined : "hidden"}
                      animate={prefersReducedMotion ? undefined : "visible"}
                      className="agent-turn"
                    >
                      {entry.role === "user" ? (
                        <p className="agent-line agent-line--user">{entry.content}</p>
                      ) : (
                        <>
                          {entry.content ? (
                            <p className="agent-line agent-line--assistant">
                              {entry.content}
                              {!entry.complete ? (
                                <span className="agent-caret" aria-hidden="true" />
                              ) : null}
                            </p>
                          ) : null}

                          {/* A failed turn has to say something. Silence after
                              the visitor's own question reads as the widget
                              being broken, which it is not — the offline brain
                              usually still has links to offer. */}
                          {entry.failed && !entry.content ? (
                            <p className="agent-line agent-line--assistant agent-line--failed">
                              {errorKind === "rate-limit"
                                ? t("errorRateLimit")
                                : t("errorGeneric")}
                            </p>
                          ) : null}

                          {entry.navigation ? (
                            <p className="agent-nav-chip">
                              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                              {t("navigatingTo", {
                                label: entry.navigation.reason || entry.navigation.label
                              })}
                            </p>
                          ) : null}

                          {entry.links.length > 0 ? (
                            <div className="agent-links">
                              {entry.links.map((link) => (
                                <a
                                  key={link.url}
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={t("openLinkAria", {label: link.label})}
                                  className="agent-link"
                                >
                                  {link.label}
                                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                                </a>
                              ))}
                            </div>
                          ) : null}

                          {entry.failed ? (
                            <button
                              type="button"
                              onClick={retry}
                              disabled={cooldown > 0}
                              className="agent-retry"
                            >
                              <RotateCcw className="h-3 w-3" aria-hidden="true" />
                              {/* A bare countdown needs no translation, and
                                  retrying straight into another 429 is the
                                  loop this whole fix exists to break. */}
                              {cooldown > 0 ? (
                                <span className="normal-case">{cooldown}s</span>
                              ) : (
                                t("retry")
                              )}
                            </button>
                          ) : null}
                        </>
                      )}
                    </motion.div>
                  ))}

                  {showTyping ? (
                    <span className="agent-typing" aria-label={t("statusThinking")}>
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : null}
                </motion.div>

                {entries.length === 0 ? (
                  <motion.div variants={m.row} className="agent-suggestions">
                    {SUGGESTION_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onPointerEnter={(event) => {
                          avatar.lookAt(event.currentTarget, 0.6);
                          avatar.engage(0.8);
                        }}
                        onPointerLeave={() => avatar.lookAt(inputRef.current, 0.45)}
                        className="agent-suggestion"
                        onClick={() => submitText(t(`suggestions.${key}`))}
                      >
                        {t(`suggestions.${key}`)}
                      </button>
                    ))}
                  </motion.div>
                ) : null}

                {/* Voice/mic problems only. Request failures are rendered as a
                    localised assistant turn in the transcript instead — the
                    server's error string is English whoever is reading it. */}
                {notice ? (
                  <p className="agent-notice" role="status">
                    {notice}
                  </p>
                ) : null}

                <motion.form variants={m.row} className="agent-composer" onSubmit={onSubmit}>
                  {/* One field. The voice affordances live inside it rather than
                      beside it, so the composer is a single object. */}
                  <div className="agent-field">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(event) => {
                        setInput(event.target.value);
                        // Typing is the clearest "I am here" signal there is.
                        // `engage` refreshes a decay timer rather than adding a
                        // listener per keystroke.
                        avatar.lookAt(event.currentTarget, 0.55);
                        avatar.engage(1);
                      }}
                      placeholder={t("placeholder")}
                      aria-label={t("placeholder")}
                      maxLength={500}
                      onFocus={(event) => {
                        avatar.lookAt(event.currentTarget, 0.55);
                        avatar.engage(0.9);
                      }}
                      className="agent-input"
                    />

                    <button
                      type="button"
                      onClick={toggleAvatarMotion}
                      data-active={avatarMotionEnabled}
                      aria-pressed={avatarMotionEnabled}
                      aria-label={
                        avatarMotionEnabled ? t("motionOff") : t("motionOn")
                      }
                      title={avatarMotionEnabled ? t("motionOff") : t("motionOn")}
                      className="agent-field-btn"
                    >
                      <Activity className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {speech.canSpeak ? (
                      <button
                        type="button"
                        onClick={speech.toggleVoice}
                        data-active={speech.voiceEnabled}
                        aria-label={speech.voiceEnabled ? t("voiceOff") : t("voiceOn")}
                        title={speech.voiceEnabled ? t("voiceOff") : t("voiceOn")}
                        className="agent-field-btn"
                      >
                        {speech.voiceEnabled ? (
                          <Volume2 className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <VolumeX className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    ) : null}

                    {speech.canListen ? (
                      <button
                        type="button"
                        onClick={speech.toggleListening}
                        data-active={speech.listening}
                        aria-label={speech.listening ? t("micStop") : t("micStart")}
                        title={speech.listening ? t("micStop") : t("micStart")}
                        className="agent-field-btn"
                      >
                        {speech.listening ? (
                          <MicOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Mic className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    ) : null}
                  </div>

                  {busy ? (
                    <button
                      type="button"
                      onClick={stop}
                      aria-label={t("stop")}
                      className="agent-send agent-send--stop"
                    >
                      <span className="agent-stop-square" aria-hidden="true" />
                      <span className="agent-send__label">{t("stopShort")}</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      aria-label={t("send")}
                      className="agent-send"
                    >
                      <Send className="h-4 w-4" aria-hidden="true" />
                      <span className="agent-send__label">{t("sendShort")}</span>
                    </button>
                  )}
                </motion.form>


              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="agent-root">
        <AnimatePresence>
          {showHint && !open && !overlayMounted ? (
            <motion.button
              key="agent-hint"
              type="button"
              variants={agentHintVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={openPanel}
              className="agent-hint"
            >
              {t("hint")}
            </motion.button>
          ) : null}
        </AnimatePresence>

        {/* Unmounted rather than hidden while the overlay is up — including
            through its exit animation — so only one WebGL context is ever
            live for a single mascot. The entrance is a CSS animation (see
            `agent-dock-in`) rather than a framer `initial`, which keeps the
            reduced-motion path in CSS and off the hydration-sensitive tree. */}
        {!open && !overlayMounted ? (
          <button
            type="button"
            onClick={openPanel}
            // The moment the feature gets used. The character looks up and
            // blinks when noticed, then braces before the chamber opens — a
            // beat of anticipation is what makes the transition feel decided
            // rather than triggered.
            onPointerEnter={(event) => {
              avatar.lookAt(event.currentTarget, 1);
              avatar.beat("greet");
              avatar.engage(1, 3200);
            }}
            onPointerLeave={() => avatar.lookAt(null)}
            onFocus={(event) => {
              avatar.lookAt(event.currentTarget, 1);
              avatar.beat("greet");
              avatar.engage(1, 3200);
            }}
            onPointerDown={() => avatar.beat("perk")}
            aria-expanded={false}
            aria-haspopup="dialog"
            aria-label={t("dockAria")}
            className="agent-dock focus-ring"
          >
            {/* Feathered backdrop — the only thing keeping page copy from
                showing through the transparent canvas. No edges anywhere. */}
            <span className="agent-dock__aura" aria-hidden="true" />

            <span className="agent-dock__stage">
              <HologramStage
                mood={mood}
                active={false}
                handleRef={dockAvatarRef}
                motionPreference={avatarMotionPreference}
                trackPointer={avatarMotionEnabled}
              />
            </span>

            <span className="agent-dock__glow" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </>
  );
}
