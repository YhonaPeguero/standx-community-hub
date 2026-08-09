"use client";

import {AnimatePresence, motion, useReducedMotion} from "framer-motion";
import {ArrowUpRight, Mic, MicOff, RotateCcw, Send, Volume2, VolumeX, X} from "lucide-react";
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
import HologramStage from "@/components/agent/HologramStage";
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
import type {AgentNavigation} from "@/lib/agent/types";

interface StandxAgentProps {
  locale: AppLocale;
}

const SUGGESTION_KEYS = ["one", "two", "three", "four"] as const;
const HINT_STORAGE_KEY = "standx-hub-agent-hint";
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

  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const spokenRef = useRef<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const currentRoute = routeFromPathname(pathname, locale);

  // The overlay covers the viewport, so staying open after a navigation would
  // hide the very page the visitor was sent to. Stand the projection down and
  // let them look; the transcript is preserved for when they reopen it.
  const handleNavigate = useCallback(
    (navigation: AgentNavigation) => {
      router.push(navigation.href);
      closeTimerRef.current = window.setTimeout(() => {
        setOpen(false);
      }, NAVIGATE_CLOSE_DELAY_MS);
    },
    [router]
  );

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
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
      void send(value);
    },
    [send]
  );

  const speech = useSpeech({
    locale,
    onTranscript: submitText,
    onInterim: setInput,
    onUnsupported: () => setNotice(t("voiceUnsupported")),
    onDenied: () => setNotice(t("micDenied"))
  });

  const busy = status === "thinking" || status === "answering";

  const mood: HologramMood = useMemo(() => {
    if (speech.listening) return "listening";
    if (speech.speaking || status === "answering") return "speaking";
    if (status === "thinking") return "thinking";
    return "idle";
  }, [speech.listening, speech.speaking, status]);

  const statusLabel = useMemo(() => {
    if (speech.listening) return t("statusListening");
    if (speech.speaking) return t("statusSpeaking");
    if (status === "thinking") return t("statusThinking");
    if (status === "answering") return t("statusAnswering");
    if (status === "error") return t("statusError");
    return t("statusOnline");
  }, [speech.listening, speech.speaking, status, t]);

  const live = busy || speech.listening || speech.speaking;

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
    const timer = window.setTimeout(
      () => inputRef.current?.focus(),
      prefersReducedMotion ? 0 : 520
    );
    return () => window.clearTimeout(timer);
  }, [open, prefersReducedMotion]);

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

            <div className="agent-overlay__inner">
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
                  trackPointer={!prefersReducedMotion}
                />
              </motion.div>

              <motion.div variants={m.deck} className="agent-console">
                <motion.div variants={m.row} className="agent-console__head">
                  <span className="agent-console__brand">{t("name")}</span>

                  <span className="agent-console__status" data-live={live}>
                    <span
                      className={live ? "live-dot" : "agent-dot-static"}
                      aria-hidden="true"
                    />
                    <span aria-live="polite">{statusLabel}</span>
                  </span>

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

                <motion.div
                  variants={m.row}
                  className="agent-transcript"
                  ref={transcriptRef}
                  role="log"
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
                      onChange={(event) => setInput(event.target.value)}
                      placeholder={t("placeholder")}
                      aria-label={t("placeholder")}
                      maxLength={500}
                      className="agent-input"
                    />

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

                <motion.p variants={m.row} className="agent-disclaimer">
                  {t("disclaimer")}
                </motion.p>
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
                trackPointer={!prefersReducedMotion}
              />
            </span>

            <span className="agent-dock__glow" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </>
  );
}
