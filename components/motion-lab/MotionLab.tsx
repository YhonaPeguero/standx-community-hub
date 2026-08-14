"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {createHologramScene, type HologramSceneHandle} from "@/lib/hologram-scene";
import {
  motionChannels,
  type ChannelMask,
  type MascotMood,
  type MotionChannel,
  type MotionTrigger
} from "@/lib/mascot/motion";

/**
 * Character motion lab.
 *
 * An isolation rig: the mascot on an empty stage, every movement switchable on
 * its own, with the numbers plotted underneath. It drives the production scene
 * and the production motion engine — there is no lab-only copy of the rig, so a
 * movement that reads correctly here is the movement that ships.
 *
 * The scopes are the point. Eyeballing a character tells you whether you like
 * it; the curve tells you whether the movement is actually doing what you think
 * — whether a blink really has a fast close and slow open, whether a spring
 * settles or hunts, whether "speech" is an envelope or a buzzer.
 */

const MOODS: readonly MascotMood[] = ["idle", "listening", "thinking", "speaking"];

const TRIGGERS: ReadonlyArray<{id: MotionTrigger; label: string}> = [
  {id: "blink", label: "Blink"},
  {id: "doubleBlink", label: "Double blink"},
  {id: "saccade", label: "Saccade"},
  {id: "react", label: "React"},
  {id: "greet", label: "Greet"},
  {id: "perk", label: "Perk"},
  {id: "acknowledge", label: "Ack"},
  {id: "nod", label: "Nod"}
];

/** What each channel owns, so the panel is self-documenting. */
const CHANNEL_NOTES: Record<MotionChannel, string> = {
  breath: "Torso rise + shell squash. Asymmetric: inhale 38%, exhale 62%.",
  sway: "Weight shift — lateral lean with counter-rotation, feet planted.",
  gaze: "Ballistic saccades between fixations, plus micro-tremor.",
  blink: "Fast close (85ms), hold (35ms), slow open (150ms).",
  speech: "Syllable train with attack/decay envelopes and real pauses.",
  gesture: "Sparse phrase beats: alternating lead arm, body emphasis, quiet gaps.",
  attention: "Looks at what the visitor is using, plus the one-shot beats.",
  arms: "Springs chasing the body — they arrive late and overshoot.",
  leaf: "Lightest mass on the rig, so the last thing to stop moving.",
  reaction: "Impulse injected on mood change. Reads as a settle, not a fade."
};

/** Fixed plot ranges. Auto-scaling makes every curve look the same. */
const CHANNEL_RANGE: Record<MotionChannel, [number, number]> = {
  breath: [-1, 1],
  sway: [-1, 1],
  gaze: [-1, 1],
  blink: [0, 1],
  speech: [0, 1],
  gesture: [-1, 1],
  attention: [-1, 1],
  arms: [-0.4, 0.4],
  leaf: [-1, 1],
  reaction: [-2, 2]
};

const SAMPLES = 260;
const SCOPE_W = 240;
const SCOPE_H = 56;

export default function MotionLab() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<HologramSceneHandle | null>(null);
  const canvasRefs = useRef<Partial<Record<MotionChannel, HTMLCanvasElement | null>>>({});
  const buffers = useRef<Record<MotionChannel, Float32Array> | null>(null);
  const writeIndex = useRef(0);

  const [ready, setReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [mood, setMood] = useState<MascotMood>("idle");
  const [active, setActive] = useState(true);
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [followMouse, setFollowMouse] = useState(false);
  const [pointer, setPointer] = useState({x: 0, y: 0});
  const [attention, setAttention] = useState({x: 0.8, y: 0, weight: 0});
  const [interest, setInterest] = useState(0);
  const [channels, setChannels] = useState<ChannelMask | null>(null);

  // ---- Scene lifecycle ----------------------------------------------------

  useEffect(() => {
    const container = stageRef.current;
    if (!container) {
      return;
    }

    // forceAnimate: inspecting movement is the entire purpose of this page, and
    // it ships with a pause control right there in the transport.
    const scene = createHologramScene({container, forceAnimate: true, motionSeed: 7});
    sceneRef.current = scene;

    if (!scene.webglAvailable) {
      setWebglFailed(true);
      return () => {
        scene.dispose();
        sceneRef.current = null;
      };
    }

    setChannels(scene.motion.getChannels());
    setReady(true);

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setMood(mood);
  }, [mood]);

  useEffect(() => {
    sceneRef.current?.setActive(active);
  }, [active]);

  useEffect(() => {
    sceneRef.current?.motion.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    sceneRef.current?.motion.setTimeScale(timeScale);
  }, [timeScale]);

  useEffect(() => {
    sceneRef.current?.motion.setPointerOverride(followMouse ? null : pointer);
  }, [followMouse, pointer]);

  useEffect(() => {
    sceneRef.current?.motion.setAttention(
      attention.weight > 0 ? attention : null
    );
  }, [attention]);

  useEffect(() => {
    sceneRef.current?.motion.setInterest(interest);
  }, [interest]);

  // Real-pointer mode reuses the same normalisation the widget uses, so gaze
  // behaves here exactly as it does in the corner of the site.
  useEffect(() => {
    if (!followMouse) {
      return;
    }
    const container = stageRef.current;
    if (!container) {
      return;
    }

    const onPointerMove = (event: PointerEvent): void => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const radius = Math.max(window.innerWidth, window.innerHeight) * 0.45;
      sceneRef.current?.setPointer(
        (event.clientX - centerX) / radius,
        (event.clientY - centerY) / radius
      );
    };

    window.addEventListener("pointermove", onPointerMove, {passive: true});
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [followMouse]);

  // ---- Scopes -------------------------------------------------------------
  // One rAF loop samples the pose and repaints every scope. Deliberately no
  // React state per frame: 60 re-renders a second would make the lab itself
  // the thing that stutters.

  useEffect(() => {
    if (!ready) {
      return;
    }

    const store = {} as Record<MotionChannel, Float32Array>;
    for (const channel of motionChannels) {
      store[channel] = new Float32Array(SAMPLES);
    }
    buffers.current = store;
    writeIndex.current = 0;

    let frame = 0;

    const draw = (): void => {
      frame = window.requestAnimationFrame(draw);
      const pose = sceneRef.current?.motion.getPose();
      if (!pose) {
        return;
      }

      const index = writeIndex.current;
      for (const channel of motionChannels) {
        store[channel][index] = pose.channels[channel];
      }
      writeIndex.current = (index + 1) % SAMPLES;

      for (const channel of motionChannels) {
        const canvas = canvasRefs.current[channel];
        const context = canvas?.getContext("2d");
        if (!canvas || !context) {
          continue;
        }

        const [min, max] = CHANNEL_RANGE[channel];
        const data = store[channel];
        const dpr = Math.min(window.devicePixelRatio, 2);
        if (canvas.width !== SCOPE_W * dpr) {
          canvas.width = SCOPE_W * dpr;
          canvas.height = SCOPE_H * dpr;
        }
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, SCOPE_W, SCOPE_H);

        // Zero line
        const zeroY =
          SCOPE_H - ((0 - min) / (max - min)) * SCOPE_H;
        if (zeroY >= 0 && zeroY <= SCOPE_H) {
          context.strokeStyle = "rgba(255,255,255,0.09)";
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(0, zeroY);
          context.lineTo(SCOPE_W, zeroY);
          context.stroke();
        }

        context.strokeStyle = "#00ff87";
        context.lineWidth = 1.5;
        context.beginPath();
        for (let i = 0; i < SAMPLES; i += 1) {
          // Read oldest-first so the trace scrolls rather than wrapping.
          const value = data[(writeIndex.current + i) % SAMPLES];
          const normalised = (value - min) / (max - min);
          const x = (i / (SAMPLES - 1)) * SCOPE_W;
          const y = SCOPE_H - Math.max(0, Math.min(1, normalised)) * SCOPE_H;
          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.stroke();

        context.fillStyle = "rgba(255,255,255,0.55)";
        context.font = "10px ui-monospace, monospace";
        context.fillText(pose.channels[channel].toFixed(3), 6, 13);
      }
    };

    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [ready]);

  // ---- Controls -----------------------------------------------------------

  const applyChannels = useCallback((next: ChannelMask) => {
    setChannels(next);
    sceneRef.current?.motion.setChannels(next);
  }, []);

  const toggleChannel = useCallback(
    (channel: MotionChannel) => {
      if (!channels) return;
      applyChannels({...channels, [channel]: !channels[channel]});
    },
    [channels, applyChannels]
  );

  const soloChannel = useCallback(
    (channel: MotionChannel) => {
      const next = {} as ChannelMask;
      for (const id of motionChannels) {
        next[id] = id === channel;
      }
      applyChannels(next);
    },
    [applyChannels]
  );

  const setAll = useCallback(
    (value: boolean) => {
      const next = {} as ChannelMask;
      for (const id of motionChannels) {
        next[id] = value;
      }
      applyChannels(next);
    },
    [applyChannels]
  );

  if (webglFailed) {
    return (
      <p className="p-8 font-mono text-sm text-signal-caution">
        WebGL is unavailable in this browser, so the rig cannot be inspected here.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border-hairline pb-4">
        <div>
          <p className="eyebrow">Motion lab</p>
          <h1 className="mt-2 text-display-md">Character movement, in isolation</h1>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-text-muted">
          Drives <code className="text-accent-lime">lib/mascot/motion.ts</code> through the
          production scene. Solo one channel, watch its curve, fix it here — then
          it is already integrated, because nothing else renders the mascot.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Stage */}
        <section className="flex flex-col gap-3">
          <div
            className="relative min-h-[420px] flex-1 border border-border-hairline bg-bg-elevated"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "32px 32px"
            }}
          >
            <div
              ref={stageRef}
              className="absolute inset-0"
              style={{filter: "drop-shadow(0 0 22px rgba(0,255,135,0.35))"}}
            />
          </div>

          {/* Transport */}
          <div className="flex flex-wrap items-center gap-2 border border-border-hairline bg-bg-elevated p-3">
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              className="btn btn-secondary min-h-9 px-3 py-1 text-[10px]"
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPaused(true);
                sceneRef.current?.motion.step(1 / 60);
              }}
              className="btn btn-ghost min-h-9 border-border-hairline px-3 py-1 text-[10px]"
            >
              Step 1f
            </button>
            <button
              type="button"
              onClick={() => sceneRef.current?.motion.reset()}
              className="btn btn-ghost min-h-9 border-border-hairline px-3 py-1 text-[10px]"
            >
              Reset
            </button>

            <label className="ml-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widepill text-text-muted">
              Speed
              <input
                type="range"
                min={0.1}
                max={2}
                step={0.05}
                value={timeScale}
                onChange={(event) => setTimeScale(Number(event.target.value))}
                className="w-28 accent-accent-lime"
              />
              <span className="w-9 text-accent-lime">{timeScale.toFixed(2)}x</span>
            </label>

            {/* Slowing time must change only the rate, never the shape. If a
                curve looks different at 0.25x, something is frame-coupled. */}
            <span className="text-[10px] text-text-muted">
              Shape must not change with speed.
            </span>
          </div>
        </section>

        {/* Panel */}
        <aside className="flex flex-col gap-4">
          <fieldset className="border border-border-hairline bg-bg-elevated p-3">
            <legend className="px-1 font-mono text-[10px] uppercase tracking-widepill text-text-muted">
              Mood
            </legend>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {MOODS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMood(id)}
                  data-active={mood === id}
                  className="border border-border-hairline px-2 py-1.5 font-mono text-[10px] uppercase tracking-widepill text-text-muted transition hover:border-accent-lime hover:text-accent-lime data-[active=true]:border-accent-lime data-[active=true]:bg-accent-lime/10 data-[active=true]:text-accent-lime"
                >
                  {id}
                </button>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widepill text-text-muted">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="accent-accent-lime"
              />
              Active (chamber open)
            </label>
          </fieldset>

          <fieldset className="border border-border-hairline bg-bg-elevated p-3">
            <legend className="px-1 font-mono text-[10px] uppercase tracking-widepill text-text-muted">
              One-shot
            </legend>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {TRIGGERS.map((trigger) => (
                <button
                  key={trigger.id}
                  type="button"
                  onClick={() => sceneRef.current?.motion.trigger(trigger.id)}
                  className="border border-border-hairline px-2 py-1.5 font-mono text-[10px] uppercase tracking-widepill text-text-muted transition hover:border-accent-lime hover:text-accent-lime"
                >
                  {trigger.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="border border-border-hairline bg-bg-elevated p-3">
            <legend className="px-1 font-mono text-[10px] uppercase tracking-widepill text-text-muted">
              Pointer
            </legend>
            <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widepill text-text-muted">
              <input
                type="checkbox"
                checked={followMouse}
                onChange={(event) => setFollowMouse(event.target.checked)}
                className="accent-accent-lime"
              />
              Follow real mouse
            </label>
            {!followMouse ? (
              <div className="mt-2 space-y-1.5">
                {(["x", "y"] as const).map((axis) => (
                  <label
                    key={axis}
                    className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widepill text-text-muted"
                  >
                    <span className="w-3">{axis}</span>
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.02}
                      value={pointer[axis]}
                      onChange={(event) =>
                        setPointer((value) => ({
                          ...value,
                          [axis]: Number(event.target.value)
                        }))
                      }
                      className="flex-1 accent-accent-lime"
                    />
                    <span className="w-10 text-right text-accent-lime">
                      {pointer[axis].toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
          </fieldset>

          <fieldset className="border border-border-hairline bg-bg-elevated p-3">
            <legend className="px-1 font-mono text-[10px] uppercase tracking-widepill text-text-muted">
              Attention
            </legend>
            <p className="mb-2 text-[10px] leading-snug text-text-muted">
              Stage-local: 0 is the mascot&apos;s own centre, 1 is roughly its frame
              edge. Weight 0 hands the eye back to ambient wandering.
            </p>
            <div className="space-y-1.5">
              {(["x", "y", "weight"] as const).map((axis) => (
                <label
                  key={axis}
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widepill text-text-muted"
                >
                  <span className="w-10">{axis}</span>
                  <input
                    type="range"
                    min={axis === "weight" ? 0 : -1.5}
                    max={axis === "weight" ? 1 : 1.5}
                    step={0.02}
                    value={attention[axis]}
                    onChange={(event) =>
                      setAttention((value) => ({
                        ...value,
                        [axis]: Number(event.target.value)
                      }))
                    }
                    className="flex-1 accent-accent-lime"
                  />
                  <span className="w-10 text-right text-accent-lime">
                    {attention[axis].toFixed(2)}
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widepill text-text-muted">
                <span className="w-10">int</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={interest}
                  onChange={(event) => setInterest(Number(event.target.value))}
                  className="flex-1 accent-accent-lime"
                />
                <span className="w-10 text-right text-accent-lime">
                  {interest.toFixed(2)}
                </span>
              </label>
            </div>
          </fieldset>

          <fieldset className="border border-border-hairline bg-bg-elevated p-3">
            <legend className="px-1 font-mono text-[10px] uppercase tracking-widepill text-text-muted">
              Channels
            </legend>
            <div className="mb-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => setAll(true)}
                className="border border-border-hairline px-2 py-1 font-mono text-[9px] uppercase tracking-widepill text-text-muted transition hover:border-accent-lime hover:text-accent-lime"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setAll(false)}
                className="border border-border-hairline px-2 py-1 font-mono text-[9px] uppercase tracking-widepill text-text-muted transition hover:border-accent-lime hover:text-accent-lime"
              >
                Rest pose
              </button>
            </div>
            <ul className="space-y-1">
              {motionChannels.map((channel) => (
                <li key={channel} className="flex items-center gap-2">
                  <label className="flex flex-1 items-center gap-2 font-mono text-[10px] uppercase tracking-widepill text-text-secondary">
                    <input
                      type="checkbox"
                      checked={channels?.[channel] ?? false}
                      onChange={() => toggleChannel(channel)}
                      className="accent-accent-lime"
                    />
                    {channel}
                  </label>
                  <button
                    type="button"
                    onClick={() => soloChannel(channel)}
                    className="border border-border-hairline px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widepill text-text-muted transition hover:border-accent-lime hover:text-accent-lime"
                  >
                    Solo
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>
        </aside>
      </div>

      {/* Scopes */}
      <section className="mt-6">
        <h2 className="eyebrow mb-3">Channel scopes — last ~4s</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {motionChannels.map((channel) => (
            <figure
              key={channel}
              className="border border-border-hairline bg-bg-elevated p-2"
              data-muted={channels ? !channels[channel] : false}
              style={{opacity: channels && !channels[channel] ? 0.4 : 1}}
            >
              <figcaption className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widepill text-accent-lime">
                  {channel}
                </span>
                <span className="font-mono text-[9px] text-text-muted">
                  {CHANNEL_RANGE[channel][0]} … {CHANNEL_RANGE[channel][1]}
                </span>
              </figcaption>
              <canvas
                ref={(node) => {
                  canvasRefs.current[channel] = node;
                }}
                style={{width: "100%", height: SCOPE_H, display: "block"}}
              />
              <p className="mt-1.5 text-[10px] leading-snug text-text-muted">
                {CHANNEL_NOTES[channel]}
              </p>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
