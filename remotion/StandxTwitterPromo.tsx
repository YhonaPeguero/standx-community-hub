import type {CSSProperties, ReactNode} from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame
} from "remotion";

export const STANDX_PROMO_WIDTH = 1080;
export const STANDX_PROMO_HEIGHT = 1350;
export const STANDX_PROMO_FPS = 30;
export const STANDX_PROMO_DURATION_IN_FRAMES = 1800;

const palette = {
  bg: "#0a0a0a",
  panel: "#101010",
  panelSoft: "#131313",
  hairline: "#1f1f1f",
  hairlineStrong: "#2a2a2a",
  text: "#ffffff",
  textSecondary: "#d7d7d7",
  textMuted: "#909090",
  lime: "#00ff87",
  limeSoft: "#7df7ba",
  blue: "#5ec2ff",
  pink: "#f472b6"
} as const;

const fontSans =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const fontMono =
  '"Geist Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace';
const easing = Easing.bezier(0.16, 1, 0.3, 1);

const scene = {
  hero: {start: 140, end: 690},
  hub: {start: 620, end: 1120},
  growth: {start: 1040, end: 1500},
  close: {start: 1420, end: 1800}
} as const;

const clamp = (
  frame: number,
  input: readonly number[],
  output: readonly number[]
) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing
  });

const plainClamp = (
  frame: number,
  input: readonly number[],
  output: readonly number[]
) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

const sceneOpacity = (frame: number, start: number, end: number) =>
  clamp(frame, [start, start + 34, end - 54, end], [0, 1, 1, 0]);

const enter = (frame: number, start: number, distance = 34): CSSProperties => {
  const progress = clamp(frame, [start, start + 32], [0, 1]);

  return {
          opacity: progress,
    transform: `translate3d(0, ${(1 - progress) * distance}px, 0)`
  };
};

const textBase: CSSProperties = {
  color: palette.text,
  fontFamily: fontSans,
  letterSpacing: 0,
  margin: 0
};

const mono: CSSProperties = {
  color: palette.lime,
  fontFamily: fontMono,
  fontWeight: 800,
  letterSpacing: "0.18em",
  margin: 0,
  textTransform: "uppercase"
};

export const StandxTwitterPromo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{background: palette.bg, overflow: "hidden"}}>
      <Audio
        src={staticFile("assets/Seed Sprout.mp3")}
        volume={(audioFrame) =>
          plainClamp(
            audioFrame,
            [0, 18, STANDX_PROMO_DURATION_IN_FRAMES - 24, STANDX_PROMO_DURATION_IN_FRAMES],
            [0, 0.86, 0.86, 0]
          )
        }
      />
      <KineticGrid />
      <TopNav />
      <HeroScene />
      <HubScene />
      <GrowthScene />
      <CloseScene />
      <BottomTicker />
      <AudioPulse />
      <ProgressBar frame={frame} />
      <SplashScene />
    </AbsoluteFill>
  );
};

const KineticGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const gridOffset = frame * 0.08;
  const scan = plainClamp(
    frame % 360,
    [0, 90, 300, 360],
    [-180, 180, 1180, 1420]
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #090909 0%, #0d0d0d 58%, #050505 100%)"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -96,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundPosition: `${-gridOffset}px ${gridOffset}px`,
          backgroundSize: "78px 78px",
          maskImage:
            "radial-gradient(ellipse 82% 78% at 46% 40%, #000 18%, transparent 82%)",
          opacity: 0.86
        }}
      />
      <div
        style={{
          position: "absolute",
          left: scan,
          top: 0,
          width: 2,
          height: "100%",
          background: palette.lime,
          boxShadow: `0 0 34px ${palette.lime}`,
          opacity: 0.24
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -300,
          top: 110,
          width: 720,
          height: 720,
          borderRadius: 720,
          background: palette.lime,
          filter: "blur(140px)",
          opacity: 0.065 + Math.sin(frame / 18) * 0.02
        }}
      />
    </AbsoluteFill>
  );
};

const TopNav: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        left: 54,
        right: 54,
        top: 32,
        height: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${palette.hairline}`
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 14}}>
        <Img
          src={staticFile("remotion/standx-logo-green.png")}
          style={{width: 126, height: 43, objectFit: "contain"}}
        />
        <span
          style={{
            ...mono,
            border: `1px solid ${palette.lime}`,
            color: palette.lime,
            fontSize: 14,
            padding: "8px 10px"
          }}
        >
          Community
        </span>
      </div>
      <div style={{display: "flex", alignItems: "center", gap: 14}}>
        <HudButton label="Menu" />
        <div
          style={{
            ...mono,
            background: palette.lime,
            color: palette.bg,
            fontSize: 15,
            padding: "18px 25px"
          }}
        >
          Start Trading
        </div>
      </div>
    </div>
  );
};

const HudButton: React.FC<{label: string}> = ({label}) => (
  <div
    style={{
      ...mono,
      border: `1px solid ${palette.hairlineStrong}`,
      color: palette.text,
      fontSize: 14,
      padding: "17px 20px"
    }}
  >
    {label}
  </div>
);

const HeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, scene.hero.start, scene.hero.end);

  return (
    <Scene opacity={opacity}>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 156
        }}
      >
        <div style={{...enter(frame, scene.hero.start + 12), display: "flex", alignItems: "center", gap: 14}}>
          <p style={{...mono, color: palette.textMuted, fontSize: 17}}>01 / Community Hub</p>
          <div style={{height: 1, width: 210, background: palette.hairline}} />
          <span style={{width: 8, height: 8, borderRadius: 8, background: palette.lime}} />
          <p style={{...mono, fontSize: 17}}>StandX · Community Infrastructure</p>
        </div>

        <h1
          style={{
            ...textBase,
            ...enter(frame, scene.hero.start + 38, 46),
            marginTop: 66,
            fontSize: 104,
            fontWeight: 900,
            lineHeight: 0.92,
            textTransform: "uppercase",
            maxWidth: 860
          }}
        >
          Your entry point into{" "}
          <span style={{color: palette.lime}}>StandX.</span>
        </h1>

        <p
          style={{
            ...textBase,
            ...enter(frame, scene.hero.start + 88, 28),
            marginTop: 38,
            color: palette.textSecondary,
            fontSize: 30,
            lineHeight: 1.32,
            maxWidth: 720
          }}
        >
          Templates, assets, guides and real references for traders, creators,
          researchers and builders.
        </p>

        <div
          style={{
            ...enter(frame, scene.hero.start + 136, 24),
            marginTop: 42,
            display: "flex",
            gap: 16
          }}
        >
          <PrimaryButton label="Get Started" />
          <OutlineButton label="Learn How It Works" />
        </div>
      </div>

      <StatsRail frame={frame} />
    </Scene>
  );
};

const StatsRail: React.FC<{frame: number}> = ({frame}) => (
  <div
    style={{
      ...enter(frame, scene.hero.start + 160, 26),
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 142,
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      borderTop: `1px solid ${palette.hairline}`,
      borderBottom: `1px solid ${palette.hairline}`
    }}
  >
    <StatBlock label="Growth Path" value={<GrowthValue />} hint="3 tiers · pure meritocracy" />
    <StatBlock label="5 Squads Available" value="Content · Creative · Tech" hint="Choose what fits you" />
    <StatBlock label="Where Everything Happens" value="StandX Discord" hint="discord.gg/standx" />
  </div>
);

const StatBlock: React.FC<{label: string; value: ReactNode; hint: string}> = ({
  label,
  value,
  hint
}) => (
  <div
    style={{
      minHeight: 152,
      padding: "25px 38px",
      borderRight: `1px solid ${palette.hairline}`
    }}
  >
    <p style={{...mono, color: palette.lime, fontSize: 15}}>{label}</p>
    <div
      style={{
        ...textBase,
        marginTop: 18,
        fontFamily: fontMono,
        fontSize: 27,
        fontWeight: 900,
        lineHeight: 1.25
      }}
    >
      {value}
    </div>
    <p
      style={{
        ...textBase,
        marginTop: 14,
        color: palette.textMuted,
        fontSize: 20
      }}
    >
      {hint}
    </p>
  </div>
);

const GrowthValue: React.FC = () => (
  <span>
    <span style={{color: palette.lime}}>SEED</span>
    <span style={{color: palette.textMuted}}> → </span>
    <span style={{color: palette.blue}}>SPROUT</span>
    <span style={{color: palette.textMuted}}> → </span>
    <span style={{color: palette.pink}}>FLOWER</span>
  </span>
);

const HubScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, scene.hub.start, scene.hub.end);

  return (
    <Scene opacity={opacity}>
      <div style={{position: "absolute", left: 72, right: 72, top: 150}}>
        <div style={{...enter(frame, scene.hub.start + 4), display: "flex", alignItems: "center", gap: 12}}>
          <div style={{height: 1, width: 28, background: palette.lime}} />
          <p style={{...mono, fontSize: 16}}>Hub Sections</p>
        </div>
        <h2
          style={{
            ...textBase,
            ...enter(frame, scene.hub.start + 34, 38),
            marginTop: 30,
            fontSize: 68,
            fontWeight: 900,
            lineHeight: 0.96,
            textTransform: "uppercase"
          }}
        >
          Navigate the Hub
        </h2>
        <p
          style={{
            ...textBase,
            ...enter(frame, scene.hub.start + 74, 24),
            marginTop: 22,
            color: palette.textSecondary,
            fontSize: 25
          }}
        >
          Seven focused spaces built for community contribution.
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 395,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)"
        }}
      >
        {hubCards.map((card, index) => (
          <HubCard key={card.title} card={card} index={index} />
        ))}
      </div>

      <DrawerPanel />
    </Scene>
  );
};

type HubCardData = {
  title: string;
  copy: string;
  color: string;
};

const hubCards: HubCardData[] = [
  {title: "Getting Started", copy: "Growth Path, squads and progression.", color: palette.lime},
  {title: "Brand Kit", copy: "Visual assets ready to publish faster.", color: palette.pink},
  {title: "Templates", copy: "Copy-ready structures for X and articles.", color: palette.blue},
  {title: "Community", copy: "Discord, projects and creator recognition.", color: palette.lime},
  {title: "Standers Insights", copy: "Curated analysis from active traders.", color: palette.blue},
  {title: "References", copy: "Real content examples from the ecosystem.", color: palette.lime}
];

const HubCard: React.FC<{card: HubCardData; index: number}> = ({card, index}) => {
  const frame = useCurrentFrame();
  const progress = clamp(
    frame,
    [scene.hub.start + 120 + index * 16, scene.hub.start + 168 + index * 16],
    [0, 1]
  );

  return (
    <div
      style={{
        opacity: progress,
        transform: `translate3d(0, ${(1 - progress) * 24}px, 0)`,
        minHeight: 180,
        padding: 28,
        border: `1px solid ${index === 0 ? palette.lime : palette.hairline}`,
        background: index === 0 ? "rgba(0,255,135,0.035)" : "rgba(16,16,16,0.92)"
      }}
    >
      <p style={{...mono, color: palette.textMuted, fontSize: 14}}>
        0{index + 1}
      </p>
      <h3
        style={{
          ...textBase,
          marginTop: 32,
          fontFamily: fontMono,
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: "0.16em",
          lineHeight: 1.1,
          textTransform: "uppercase"
        }}
      >
        {card.title}
      </h3>
      <p
        style={{
          ...textBase,
          marginTop: 16,
          color: palette.textSecondary,
          fontSize: 20,
          lineHeight: 1.35
        }}
      >
        {card.copy}
      </p>
      <p
        style={{
          ...mono,
          color: card.color,
          marginTop: 22,
          fontSize: 15
        }}
      >
        Open ↗
      </p>
    </div>
  );
};

const DrawerPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = clamp(frame, [scene.hub.start + 260, scene.hub.start + 324], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: progress,
        background: `rgba(0,0,0,${0.28 * progress})`
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: 410,
          background: palette.panel,
          borderLeft: `1px solid ${palette.hairline}`,
          transform: `translate3d(${(1 - progress) * 410}px, 0, 0)`
        }}
      >
        <p style={{...mono, margin: "64px 34px 22px", fontSize: 17}}>
          ● Navigate the Hub
        </p>
        {["Home", "Getting Started", "Brand Kit", "Templates", "References", "Community"].map((item, index) => (
          <div
            key={item}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "23px 34px",
              borderTop: `1px solid ${palette.hairline}`
            }}
          >
            <span style={{...mono, color: palette.textMuted, fontSize: 14}}>
              0{index + 1}
            </span>
            <span style={{...mono, color: index === 0 ? palette.lime : palette.text, fontSize: 17}}>
              {item}
            </span>
            <span style={{color: palette.lime, fontFamily: fontMono}}>→</span>
          </div>
        ))}
        <div
          style={{
            ...mono,
            position: "absolute",
            left: 34,
            right: 34,
            bottom: 70,
            background: palette.lime,
            color: palette.bg,
            fontSize: 17,
            padding: "25px 18px",
            textAlign: "center"
          }}
        >
          Start Trading
        </div>
      </div>
    </div>
  );
};

const GrowthScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, scene.growth.start, scene.growth.end);

  return (
    <Scene opacity={opacity}>
      <div style={{position: "absolute", left: 72, right: 72, top: 154}}>
        <p style={{...mono, ...enter(frame, scene.growth.start + 4), fontSize: 16}}>
          / Getting Started
        </p>
        <h2
          style={{
            ...textBase,
            ...enter(frame, scene.growth.start + 34, 34),
            marginTop: 28,
            fontSize: 70,
            fontWeight: 900,
            lineHeight: 0.98,
            textTransform: "uppercase"
          }}
        >
          How to get started on StandX
        </h2>
        <Notice />
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 535
        }}
      >
        <GrowthPath frame={frame} />
        <StepList frame={frame} />
      </div>
    </Scene>
  );
};

const Notice: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...enter(frame, scene.growth.start + 78, 24),
        marginTop: 34,
        border: `1px solid ${palette.lime}`,
        padding: "24px 26px",
        color: palette.text,
        fontFamily: fontSans,
        fontSize: 22,
        fontWeight: 700
      }}
    >
      <span style={{color: palette.lime}}>●</span>{" "}
      This hub is for everyone. Choose a squad, contribute, and grow.
    </div>
  );
};

const GrowthPath: React.FC<{frame: number}> = ({frame}) => (
  <div
    style={{
      ...enter(frame, scene.growth.start + 122, 28),
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      border: `1px solid ${palette.hairline}`
    }}
  >
    {[
      {name: "SEED", color: palette.lime, detail: "Start"},
      {name: "SPROUT", color: palette.blue, detail: "Deliver"},
      {name: "FLOWER", color: palette.pink, detail: "Lead"}
    ].map((tier, index) => (
      <div
        key={tier.name}
        style={{
          padding: "26px 28px",
          minHeight: 142,
          borderRight: `1px solid ${palette.hairline}`,
          background: index === 0 ? "rgba(0,255,135,0.045)" : palette.panel
        }}
      >
        <p style={{...mono, color: palette.textMuted, fontSize: 14}}>
          0{index + 1}
        </p>
        <p
          style={{
            ...textBase,
            marginTop: 24,
            color: tier.color,
            fontFamily: fontMono,
            fontSize: 35,
            fontWeight: 900
          }}
        >
          {tier.name}
        </p>
        <p style={{...textBase, marginTop: 7, color: palette.textSecondary, fontSize: 19}}>
          {tier.detail}
        </p>
      </div>
    ))}
  </div>
);

const StepList: React.FC<{frame: number}> = ({frame}) => {
  const steps = [
    "Accumulate Engage Points",
    "Apply for @SEED",
    "Choose your Squad",
    "Complete tasks",
    "Reach @FLOWER"
  ];

  return (
    <div style={{marginTop: 36}}>
      {steps.map((step, index) => {
        const progress = clamp(
          frame,
          [scene.growth.start + 160 + index * 14, scene.growth.start + 210 + index * 14],
          [0, 1]
        );

        return (
          <div
            key={step}
            style={{
              opacity: progress,
              transform: `translate3d(${(1 - progress) * 20}px, 0, 0)`,
              display: "grid",
              gridTemplateColumns: "42px 1fr",
              alignItems: "center",
              minHeight: 68,
              borderBottom: `1px solid ${palette.hairline}`
            }}
          >
            <span style={{width: 9, height: 9, borderRadius: 9, background: palette.lime, boxShadow: `0 0 18px ${palette.lime}`}} />
            <p
              style={{
                ...textBase,
                fontFamily: fontMono,
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: "0.04em"
              }}
            >
              {index + 1}. {step}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = clamp(frame, [scene.close.start, scene.close.start + 44], [0, 1]);
  const flash = clamp(frame, [scene.close.start, scene.close.start + 36, scene.close.start + 78], [0, 1, 0]);

  return (
    <Scene opacity={opacity}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: palette.lime,
          opacity: flash
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 198,
          display: "grid",
          gap: 36
        }}
      >
        <p style={{...mono, ...enter(frame, scene.close.start + 58), fontSize: 18}}>
          StandX · Community Hub
        </p>
        <h2
          style={{
            ...textBase,
            ...enter(frame, scene.close.start + 105, 36),
            fontSize: 94,
            fontWeight: 900,
            lineHeight: 0.92,
            textTransform: "uppercase",
            maxWidth: 900
          }}
        >
          Stand together.
          <br />
          Build forward.
        </h2>
        <p
          style={{
            ...textBase,
            ...enter(frame, scene.close.start + 195, 26),
            color: palette.textSecondary,
            fontSize: 31,
            lineHeight: 1.3,
            maxWidth: 780
          }}
        >
          Join Discord, explore resources, and start contributing to the StandX
          ecosystem.
        </p>
      </div>

      <div
        style={{
          ...enter(frame, scene.close.start + 260, 28),
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 170,
          display: "grid",
          gap: 18
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: palette.lime,
            color: palette.bg,
            padding: "30px 34px"
          }}
        >
          <p
            style={{
              fontFamily: fontSans,
              fontSize: 44,
              fontWeight: 900,
              margin: 0,
              textTransform: "uppercase"
            }}
          >
            Join Discord
          </p>
          <p style={{...mono, color: palette.bg, fontSize: 25}}>
            discord.gg/standx
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: palette.textMuted,
            fontFamily: fontMono,
            fontSize: 20,
            letterSpacing: "0.15em",
            textTransform: "uppercase"
          }}
        >
          <span>@StandX_Official</span>
          <span>standx.com</span>
        </div>
      </div>
    </Scene>
  );
};

const PrimaryButton: React.FC<{label: string}> = ({label}) => (
  <div
    style={{
      ...mono,
      background: palette.lime,
      color: palette.bg,
      fontSize: 16,
      padding: "21px 26px"
    }}
  >
    {label} ↗
  </div>
);

const OutlineButton: React.FC<{label: string}> = ({label}) => (
  <div
    style={{
      ...mono,
      border: `1px solid ${palette.lime}`,
      color: palette.lime,
      fontSize: 16,
      padding: "20px 26px"
    }}
  >
    {label}
  </div>
);

const Scene: React.FC<{children: ReactNode; opacity: number}> = ({
  children,
  opacity
}) => (
  <AbsoluteFill style={{opacity, pointerEvents: "none"}}>
    {children}
  </AbsoluteFill>
);

const SplashScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = plainClamp(frame, [0, 120, 160], [1, 1, 0]);
  const wordScale = clamp(frame, [0, 86], [0.97, 1]);

  return (
    <AbsoluteFill
      style={{
        opacity,
        background: palette.lime,
        color: palette.bg,
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 38,
          ...mono,
          color: palette.bg,
          fontSize: 18
        }}
      >
        StandX · Community Hub
      </div>
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 38,
          ...mono,
          color: palette.bg,
          fontSize: 18
        }}
      >
        Initializing ●
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          backgroundImage:
            "linear-gradient(to right, rgba(10,10,10,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.08) 1px, transparent 1px)",
          backgroundSize: "78px 78px"
        }}
      >
        <div style={{textAlign: "center", transform: `scale(${wordScale})`}}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 28
            }}
          >
            <BeStandWordmark frame={frame} />
            <Img
              src={staticFile("remotion/standx-personaje-cutout.png")}
              style={{
                width: 158,
                height: 186,
                objectFit: "contain",
                filter: "drop-shadow(0 16px 28px rgba(10,10,10,0.22))",
                opacity: clamp(frame, [34, 82], [0, 1]),
                transform: `translate3d(0, ${
                  clamp(frame, [34, 82], [40, 0]) + Math.sin(frame / 22) * 2
                }px, 0) scale(${clamp(frame, [34, 82], [0.86, 1])})`
              }}
            />
          </div>
          <div
            style={{
              width: 520,
              height: 1,
              margin: "36px auto 0",
              background: "rgba(10,10,10,0.35)"
            }}
          />
          <p
            style={{
              ...mono,
              marginTop: 34,
              color: palette.bg,
              fontSize: 22,
              letterSpacing: "0.26em"
            }}
          >
            Stand Together · Build Forward
          </p>
        </div>
      </div>
      <p
        style={{
          ...mono,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 38,
          color: "rgba(10,10,10,0.18)",
          fontSize: 14,
          letterSpacing: "0.26em",
          textAlign: "center"
        }}
      >
        Click or press any key to skip
      </p>
    </AbsoluteFill>
  );
};

const BeStandWordmark: React.FC<{frame: number}> = ({frame}) => {
  const maskWidth = clamp(frame, [8, 44], [0, 720]);

  return (
    <svg
      viewBox="0 0 720 160"
      preserveAspectRatio="xMidYMid meet"
      style={{display: "block", width: 520, height: 116}}
      aria-label="Be Stand"
      role="img"
    >
      <defs>
        <mask id="standx-promo-bestand-wipe">
          <rect x="0" y="0" width={maskWidth} height="160" fill="#ffffff" />
        </mask>
      </defs>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="none"
        stroke={palette.bg}
        strokeOpacity="0.22"
        strokeWidth="1.5"
        style={{
          fontFamily: fontSans,
          fontSize: 140,
          fontWeight: 900,
          letterSpacing: "-0.04em"
        }}
      >
        BE STAND
      </text>
      <g mask="url(#standx-promo-bestand-wipe)">
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill={palette.bg}
          style={{
            fontFamily: fontSans,
            fontSize: 140,
            fontWeight: 900,
            letterSpacing: "-0.04em"
          }}
        >
          BE STAND
        </text>
      </g>
    </svg>
  );
};

const BottomTicker: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = -((frame * 0.85) % 850);
  const items = [
    "Growth Path",
    "Brand Kit",
    "Templates",
    "Community",
    "Standers Insights",
    "Discord",
    "Start Trading"
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: -150,
        right: -150,
        bottom: 70,
        height: 46,
        overflow: "hidden",
        borderTop: `1px solid ${palette.hairline}`,
        borderBottom: `1px solid ${palette.hairline}`,
        transform: "rotate(-2.2deg)",
        opacity: 0.62
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 38,
          height: "100%",
          transform: `translate3d(${shift}px, 0, 0)`
        }}
      >
        {Array.from({length: 4}).flatMap((_, repeat) =>
          items.map((item) => (
            <span
              key={`${repeat}-${item}`}
              style={{
                ...mono,
                color: repeat % 2 === 0 ? palette.textMuted : palette.lime,
                fontSize: 17,
                whiteSpace: "nowrap"
              }}
            >
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  );
};

const AudioPulse: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = Array.from({length: 16}, (_, index) => {
    const height = 8 + (Math.sin(frame / 12 + index * 0.9) * 0.5 + 0.5) * 36;

    return (
      <span
        key={index}
        style={{
          width: 5,
          height,
          background: index % 3 === 0 ? palette.lime : palette.hairlineStrong
        }}
      />
    );
  });

  return (
    <div
      style={{
        position: "absolute",
        right: 56,
        bottom: 32,
        height: 46,
        display: "flex",
        alignItems: "flex-end",
        gap: 5,
        opacity: 0.85
      }}
    >
      {bars}
    </div>
  );
};

const ProgressBar: React.FC<{frame: number}> = ({frame}) => {
  const progress = plainClamp(frame, [0, STANDX_PROMO_DURATION_IN_FRAMES - 1], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: `${progress * 100}%`,
        height: 4,
        background: palette.lime,
        boxShadow: `0 0 24px ${palette.lime}`
      }}
    />
  );
};
