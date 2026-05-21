import Link from "next/link";
import {
  Rocket,
  Palette,
  FileText,
  Library,
  Users,
  Activity,
  Info,
  ArrowUpRight,
  type LucideIcon
} from "lucide-react";
import type {AppLocale} from "@/i18n/request";
import {getHubNavItems, type HubSectionSlug} from "@/lib/hub-navigation";

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

const sectionIcons: Record<HubSectionSlug, LucideIcon> = {
  "getting-started": Rocket,
  "brand-kit": Palette,
  templates: FileText,
  references: Library,
  community: Users,
  "standers-insights": Activity,
  about: Info
};

// Per-slug accent — gives each card a small color identity at rest so the grid
// reads as differentiated tiles, not a uniform gray slab. Mirrors the Growth
// Path palette (lime / sky / pink) so the hub stays on one visual system.
// Hover state still escalates to the brand lime via class hovers below.
const sectionAccents: Record<HubSectionSlug, {hex: string; rgb: string}> = {
  "getting-started": {hex: "#00ff87", rgb: "0,255,135"}, // lime — growth/start
  "brand-kit": {hex: "#f472b6", rgb: "244,114,182"}, // pink — creative
  templates: {hex: "#5ec2ff", rgb: "94,194,255"}, // sky — building blocks
  references: {hex: "#00ff87", rgb: "0,255,135"}, // lime
  community: {hex: "#f472b6", rgb: "244,114,182"}, // pink
  "standers-insights": {hex: "#5ec2ff", rgb: "94,194,255"}, // sky
  about: {hex: "#00ff87", rgb: "0,255,135"} // lime
};

export default function SectionDirectory({locale}: SectionDirectoryProps) {
  const items = getHubNavItems(locale);
  const copy = directoryCopy[locale];

  return (
    <section className="section-shell border-b border-border-hairline py-16 md:py-24">
      <div className="flex items-end justify-between gap-6 pb-10 md:pb-12">
        <div className="space-y-4">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="text-display-lg uppercase text-text-primary">{copy.title}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">
            {copy.subtitle}
          </p>
        </div>
        <span className="hidden font-mono text-[11px] uppercase tracking-widercaps text-text-muted md:inline">
          {String(items.length).padStart(2, "0")} sections
        </span>
      </div>

      {/* Dense grid. gap-px + bg-border-hairline on the wrapper renders 1-px
          dividers between every card at every breakpoint (1 / 2 / 3 cols),
          including the partial last row (card 7 alone). The previous
          [&:nth-child(...)]:border-r approach left a stray vertical border on
          card 7's right edge with nothing to its right. */}
      <div className="mt-0 grid grid-cols-1 gap-px border border-border-hairline bg-border-hairline sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const Icon = sectionIcons[item.slug];
          const accent = sectionAccents[item.slug];
          const number = String(index + 1).padStart(2, "0");
          return (
            <Link
              key={item.slug}
              href={item.href}
              aria-label={`${item.label} — ${descriptions[locale][item.slug]}`}
              style={
                {
                  ["--card-accent" as string]: accent.hex,
                  ["--card-accent-rgb" as string]: accent.rgb,
                  animationDelay: `${index * 70}ms`
                } as React.CSSProperties
              }
              className="card-tinted card-entrance group focus-ring relative flex flex-col gap-5 bg-bg-base p-6 transition-all duration-300 md:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widercaps text-text-muted transition-colors group-hover:text-text-secondary">
                  {number}
                </span>
                <Icon
                  className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                  style={{
                    color: accent.hex,
                    filter: `drop-shadow(0 0 8px rgba(${accent.rgb}, 0.45))`
                  }}
                  aria-hidden="true"
                />
              </div>

              <div className="space-y-2">
                <h3
                  className="font-mono text-base font-semibold uppercase tracking-widepill text-text-primary transition-colors duration-300 md:text-lg group-hover:[color:var(--card-accent)]"
                >
                  {item.label}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {descriptions[locale][item.slug]}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between pt-2">
                <span
                  className="font-mono text-[11px] font-semibold uppercase tracking-widepill transition-colors duration-300"
                  style={{color: accent.hex}}
                >
                  {copy.openSection}
                </span>
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  style={{
                    color: accent.hex,
                    filter: `drop-shadow(0 0 6px rgba(${accent.rgb}, 0.35))`
                  }}
                  aria-hidden="true"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
