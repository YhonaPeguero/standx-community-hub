import Link from "next/link";
import {
  Rocket,
  Palette,
  FileText,
  Library,
  Users,
  Activity,
  Info,
  ArrowRight,
  type LucideIcon
} from "lucide-react";
import type {AppLocale} from "@/i18n/request";
import {getHubNavItems, type HubSectionSlug} from "@/lib/hub-navigation";
import ScrollRevealImage from "@/components/ScrollRevealImage";

interface SectionDirectoryProps {
  locale: AppLocale;
}

interface DirectoryCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  openSection: string;
}

const descriptions: Record<AppLocale, Record<HubSectionSlug, string>> = {
  en: {
    "getting-started": "Growth Path, step-by-step progression, squads, and SPROUT requirements.",
    "brand-kit": "Community visual assets with usage context and official folders.",
    templates: "Copy-ready structures for articles, X threads, radar analysis, and glossary entries.",
    references: "Real content references from the StandX ecosystem and creator output.",
    community: "Discord entry point, community project, and creators that inspire new contributors.",
    "standers-insights": "Curated analysis and educational pieces from active community traders.",
    about: "Who built this hub, why it exists, and how the community initiative evolved."
  },
  es: {
    "getting-started": "Growth Path, progresión paso a paso, squads y requisitos para subir a SPROUT.",
    "brand-kit": "Assets visuales de la comunidad con contexto de uso y carpetas oficiales.",
    templates: "Estructuras listas para copiar: artículos, hilos en X, radar competitivo y glosario.",
    references: "Referencias reales de contenido publicado para el ecosistema StandX.",
    community: "Punto de entrada a Discord, proyecto comunitario y creadores que inspiran.",
    "standers-insights": "Análisis curado y piezas educativas de traders activos de la comunidad.",
    about: "Quién construyó este hub, por qué existe y cómo evolucionó la iniciativa comunitaria."
  },
  "pt-br": {
    "getting-started": "Growth Path, progressão passo a passo, squads e requisitos para subir para SPROUT.",
    "brand-kit": "Assets visuais da comunidade com contexto de uso e pastas oficiais.",
    templates: "Estruturas prontas para copiar: artigos, threads no X, radar competitivo e glossário.",
    references: "Referências reais de conteúdo publicado para o ecossistema StandX.",
    community: "Ponto de entrada no Discord, projeto comunitário e criadores que inspiram.",
    "standers-insights": "Análises curadas e materiais educativos de traders ativos da comunidade.",
    about: "Quem construiu este hub, por que ele existe e como a iniciativa comunitária evoluiu."
  },
  uk: {
    "getting-started": "Growth Path, покроковий розвиток, squads та вимоги для переходу до SPROUT.",
    "brand-kit": "Візуальні ресурси спільноти, контекст використання та офіційні папки.",
    templates: "Готові шаблони для статей, X-тредів, радару конкуренції та глосарію.",
    references: "Реальні приклади контенту, створеного для екосистеми StandX.",
    community: "Точка входу в Discord, community project та креатори, що надихають.",
    "standers-insights": "Кураторські аналітичні матеріали від активних трейдерів спільноти.",
    about: "Хто створив цей хаб, чому він існує та як розвивалась ініціатива спільноти."
  },
  ko: {
    "getting-started": "Growth Path, 단계별 진행, squads 구조와 SPROUT 승급 기준.",
    "brand-kit": "커뮤니티 시각 에셋, 사용 맥락, 공식 폴더 링크를 한 번에 확인.",
    templates: "아티클, X 스레드, 경쟁 레이더, 용어집용 복사용 템플릿 모음.",
    references: "StandX 생태계에서 실제로 제작된 콘텐츠 레퍼런스.",
    community: "Discord 진입점, 커뮤니티 프로젝트, 신규 기여자를 이끄는 크리에이터 소개.",
    "standers-insights": "활동 중인 커뮤니티 트레이더들의 큐레이션 분석 아카이브.",
    about: "이 허브를 만든 사람과 목적, 그리고 커뮤니티 이니셔티브의 배경."
  }
};

const directoryCopy: Record<AppLocale, DirectoryCopy> = {
  en: {
    eyebrow: "Hub Sections",
    title: "Navigate the hub",
    subtitle: "Seven focused spaces built for traders, creators and researchers.",
    openSection: "Open"
  },
  es: {
    eyebrow: "Secciones del Hub",
    title: "Navega el hub",
    subtitle: "Siete espacios enfocados para traders, creadores e investigadores.",
    openSection: "Abrir"
  },
  "pt-br": {
    eyebrow: "Seções do Hub",
    title: "Navegue pelo hub",
    subtitle: "Sete espaços focados para traders, criadores e pesquisadores.",
    openSection: "Abrir"
  },
  uk: {
    eyebrow: "Розділи хабу",
    title: "Навігація хабом",
    subtitle: "Сім сфокусованих розділів для трейдерів, креаторів і дослідників.",
    openSection: "Відкрити"
  },
  ko: {
    eyebrow: "허브 섹션",
    title: "허브 둘러보기",
    subtitle: "트레이더, 크리에이터, 리서처를 위한 7개의 집중된 공간.",
    openSection: "열기"
  }
};

// Per-section lucide icon (stand-in for the 3D icons in the design ref).
const sectionIcons: Record<HubSectionSlug, LucideIcon> = {
  "getting-started": Rocket,
  "brand-kit": Palette,
  templates: FileText,
  references: Library,
  community: Users,
  "standers-insights": Activity,
  about: Info
};

// Per-card color theme, cycled by index (preserves the prior 4-color rotation).
interface BrandTheme {
  hex: string;
  rgb: string; // "r,g,b" for rgba() composition
  edgeBase: string;
  edgeHover: string;
  titleHover: string;
}

const brandThemes: readonly BrandTheme[] = [
  {
    hex: "#00ff9d",
    rgb: "0,255,157",
    edgeBase:
      "!shadow-[0_20px_60px_-20px_rgba(0,255,157,0.08),inset_0_0_0_1px_rgba(0,255,157,0.14)]",
    edgeHover:
      "hover:!shadow-[0_28px_80px_-24px_rgba(0,255,157,0.22),inset_0_0_0_1px_rgba(0,255,157,0.34)]",
    titleHover: "group-hover:text-accent-gain"
  },
  {
    hex: "#00d4ff",
    rgb: "0,212,255",
    edgeBase:
      "!shadow-[0_20px_60px_-20px_rgba(0,212,255,0.08),inset_0_0_0_1px_rgba(0,212,255,0.14)]",
    edgeHover:
      "hover:!shadow-[0_28px_80px_-24px_rgba(0,212,255,0.22),inset_0_0_0_1px_rgba(0,212,255,0.34)]",
    titleHover: "group-hover:text-[#00d4ff]"
  },
  {
    hex: "#ff4da6",
    rgb: "255,77,166",
    edgeBase:
      "!shadow-[0_20px_60px_-20px_rgba(255,77,166,0.08),inset_0_0_0_1px_rgba(255,77,166,0.14)]",
    edgeHover:
      "hover:!shadow-[0_28px_80px_-24px_rgba(255,77,166,0.22),inset_0_0_0_1px_rgba(255,77,166,0.34)]",
    titleHover: "group-hover:text-[#ff4da6]"
  },
  {
    hex: "#8a5cff",
    rgb: "138,92,255",
    edgeBase:
      "!shadow-[0_20px_60px_-20px_rgba(138,92,255,0.08),inset_0_0_0_1px_rgba(138,92,255,0.14)]",
    edgeHover:
      "hover:!shadow-[0_28px_80px_-24px_rgba(138,92,255,0.22),inset_0_0_0_1px_rgba(138,92,255,0.34)]",
    titleHover: "group-hover:text-[#8a5cff]"
  }
] as const;

// Deterministic HUD-style telemetry readout. Pure aesthetic / SSR-safe.
function hudCoords(index: number): {x: string; y: string} {
  const x = (12.34 + index * 3.87) % 100;
  const y = (7.09 + index * 2.63) % 100;
  return {x: x.toFixed(2), y: y.toFixed(2)};
}

// Deterministic sparkline path so every card shows a unique-looking line
// without hydration mismatches.
function sparklinePath(index: number, width = 120, height = 26): string {
  const points = 8;
  const seed = (index + 1) * 0.73;
  const step = width / (points - 1);
  const coords: string[] = [];
  for (let i = 0; i < points; i += 1) {
    const t = i / (points - 1);
    const wave =
      Math.sin(t * 6 + seed) * 0.35 +
      Math.sin(t * 11 + seed * 1.7) * 0.25 +
      Math.cos(t * 3.2 + seed * 0.6) * 0.2;
    const yNorm = 0.5 - wave * 0.45;
    const x = i * step;
    const y = Math.max(2, Math.min(height - 2, yNorm * height));
    coords.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return coords.join(" ");
}

function CornerBrackets({color}: {color: string}) {
  const base =
    "pointer-events-none absolute h-3.5 w-3.5 opacity-70 transition-opacity duration-300 group-hover:opacity-100";
  return (
    <>
      <span
        aria-hidden="true"
        className={`${base} left-2.5 top-2.5 border-l border-t`}
        style={{borderColor: color}}
      />
      <span
        aria-hidden="true"
        className={`${base} right-2.5 top-2.5 border-r border-t`}
        style={{borderColor: color}}
      />
      <span
        aria-hidden="true"
        className={`${base} bottom-2.5 left-2.5 border-b border-l`}
        style={{borderColor: color}}
      />
      <span
        aria-hidden="true"
        className={`${base} bottom-2.5 right-2.5 border-b border-r`}
        style={{borderColor: color}}
      />
    </>
  );
}

export default function SectionDirectory({locale}: SectionDirectoryProps) {
  const items = getHubNavItems(locale);
  const copy = directoryCopy[locale];

  return (
    <section className="section-shell relative pb-10 md:pb-14">
      {/* bearmarket mascot — bottom-right scroll-reveal accent, desktop only */}
      <ScrollRevealImage
        src="/assets/bearmarket.png"
        alt=""
        width={340}
        height={340}
        direction="right"
        threshold={0.08}
        wrapperClassName="pointer-events-none absolute -bottom-6 -right-10 -z-10 hidden select-none lg:block"
        wrapperStyle={{
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 15%, transparent 65%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 15%, transparent 65%)"
        }}
        className="h-[340px] w-[340px] object-contain opacity-[0.16]"
      />

      <ScrollRevealImage
        src="/assets/tryhardtraderstandx.png"
        alt=""
        width={260}
        height={260}
        direction="left"
        threshold={0.12}
        wrapperClassName="pointer-events-none absolute -left-12 top-0 -z-10 hidden select-none md:block"
        wrapperStyle={{
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 15%, transparent 65%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 15%, transparent 65%)"
        }}
        className="h-[260px] w-[260px] object-contain opacity-[0.15]"
      />

      {/* standxProfile — top-right scroll-reveal accent */}
      <ScrollRevealImage
        src="/assets/standxProfile.png"
        alt=""
        width={320}
        height={320}
        direction="right"
        threshold={0.10}
        wrapperClassName="pointer-events-none absolute -right-32 top-16 -z-10 hidden select-none lg:block"
        wrapperStyle={{
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 20%, transparent 70%)"
        }}
        className="h-[320px] w-[320px] object-contain opacity-[0.2]"
      />

      <header className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[#00d4ff] md:text-4xl drop-shadow-[0_0_12px_rgba(0,212,255,0.2)]">
            {copy.title}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">
            {copy.subtitle}
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const theme = brandThemes[index % brandThemes.length];
          const Icon = sectionIcons[item.slug];
          const {x, y} = hudCoords(index);
          const number = String(index + 1).padStart(2, "0");
          const gradientSparkId = `spark-grad-${item.slug}`;

          return (
            <Link
              key={item.slug}
              href={item.href}
              className={`panel panel-edge panel-hover focus-ring group relative flex flex-col overflow-hidden p-5 pt-6 transition-all duration-300 md:p-6 md:pt-7 ${theme.edgeBase} ${theme.edgeHover}`}
              aria-label={`${item.label} — ${descriptions[locale][item.slug]}`}
            >
              <CornerBrackets color={theme.hex} />

              {/* Ambient per-card glow, revealed on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 left-1/2 h-36 w-48 -translate-x-1/2 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
                style={{background: `radial-gradient(circle, rgba(${theme.rgb},0.35), transparent 70%)`}}
              />

              {/* HUD header: numbered bracket + coords */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-3 flex-col justify-between"
                  >
                    <span
                      className="block h-[2px] w-full"
                      style={{background: theme.hex, boxShadow: `0 0 6px ${theme.hex}`}}
                    />
                    <span
                      className="block h-[2px] w-full"
                      style={{background: theme.hex, opacity: 0.4}}
                    />
                  </span>
                  <span
                    className="font-mono text-2xl font-bold leading-none tracking-tight md:text-[28px]"
                    style={{color: theme.hex, textShadow: `0 0 12px rgba(${theme.rgb},0.45)`}}
                  >
                    {number}
                  </span>
                </div>
                <div
                  className="flex flex-col items-end gap-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted/80"
                  aria-hidden="true"
                >
                  <span>X: {x}</span>
                  <span>Y: {y}</span>
                </div>
              </div>

              {/* Title */}
              <p
                className={`relative z-10 mt-4 text-lg font-semibold uppercase leading-tight tracking-wide text-text-primary transition-colors md:text-xl ${theme.titleHover}`}
              >
                {item.label}
              </p>

              {/* Icon medallion */}
              <div className="relative z-10 mt-4 flex items-center justify-center">
                <div
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-[1.03]"
                  style={{
                    borderColor: `rgba(${theme.rgb},0.35)`,
                    background: `linear-gradient(135deg, rgba(${theme.rgb},0.16), rgba(${theme.rgb},0.04))`,
                    boxShadow: `inset 0 0 0 1px rgba(${theme.rgb},0.12), 0 0 22px -6px rgba(${theme.rgb},0.35)`
                  }}
                >
                  <Icon
                    className="h-7 w-7"
                    style={{color: theme.hex, filter: `drop-shadow(0 0 8px rgba(${theme.rgb},0.55))`}}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Description */}
              <p className="relative z-10 mt-4 text-center text-[13px] leading-relaxed text-text-secondary md:text-sm">
                {descriptions[locale][item.slug]}
              </p>

              {/* Sparkline readout */}
              <div className="relative z-10 mt-4 flex items-center gap-2">
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted/70"
                  aria-hidden="true"
                >
                  SIG
                </span>
                <svg
                  viewBox="0 0 120 26"
                  className="h-[22px] flex-1"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id={gradientSparkId} x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor={theme.hex} stopOpacity="0.05" />
                      <stop offset="100%" stopColor={theme.hex} stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path
                    d={sparklinePath(index)}
                    fill="none"
                    stroke={`url(#${gradientSparkId})`}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{filter: `drop-shadow(0 0 4px rgba(${theme.rgb},0.55))`}}
                  />
                </svg>
              </div>

              {/* OPEN CTA — unified pink → violet → cyan gradient */}
              <div className="relative z-10 mt-4">
                <span
                  className="relative flex items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.28em] text-[#05070f] shadow-[0_8px_24px_-8px_rgba(255,77,166,0.55)] transition-transform duration-300 group-hover:translate-y-[-1px]"
                  style={{
                    background:
                      "linear-gradient(90deg, #ff4da6 0%, #8a5cff 55%, #00d4ff 100%)"
                  }}
                >
                  <span className="relative z-10">{copy.openSection.toUpperCase()}</span>
                  <ArrowRight
                    className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
