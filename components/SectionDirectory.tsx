import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
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
          const brandProfiles = [
            // Green (#00ff9d)
            {
              baseShadow: "!shadow-[0_20px_60px_-20px_rgba(0,255,157,0.08),inset_0_0_0_1px_rgba(0,255,157,0.12)]",
              hoverShadow: "hover:!shadow-[0_28px_80px_-24px_rgba(0,255,157,0.22),inset_0_0_0_1px_rgba(0,255,157,0.3)]",
              iconHover: "group-hover:text-accent-gain group-hover:drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]",
              titleHover: "group-hover:text-accent-gain",
              pillHover: "group-hover:border-accent-gain/40 group-hover:bg-accent-gain/10 group-hover:text-accent-gain group-hover:shadow-[0_0_12px_rgba(0,255,157,0.25)]",
            },
            // Cyan (#00d4ff)
            {
              baseShadow: "!shadow-[0_20px_60px_-20px_rgba(0,212,255,0.08),inset_0_0_0_1px_rgba(0,212,255,0.12)]",
              hoverShadow: "hover:!shadow-[0_28px_80px_-24px_rgba(0,212,255,0.22),inset_0_0_0_1px_rgba(0,212,255,0.3)]",
              iconHover: "group-hover:text-[#00d4ff] group-hover:drop-shadow-[0_0_8px_rgba(0,212,255,0.6)]",
              titleHover: "group-hover:text-[#00d4ff]",
              pillHover: "group-hover:border-[#00d4ff]/40 group-hover:bg-[#00d4ff]/10 group-hover:text-[#00d4ff] group-hover:shadow-[0_0_12px_rgba(0,212,255,0.25)]",
            },
            // Pink (#ff4da6)
            {
              baseShadow: "!shadow-[0_20px_60px_-20px_rgba(255,77,166,0.08),inset_0_0_0_1px_rgba(255,77,166,0.12)]",
              hoverShadow: "hover:!shadow-[0_28px_80px_-24px_rgba(255,77,166,0.22),inset_0_0_0_1px_rgba(255,77,166,0.3)]",
              iconHover: "group-hover:text-[#ff4da6] group-hover:drop-shadow-[0_0_8px_rgba(255,77,166,0.6)]",
              titleHover: "group-hover:text-[#ff4da6]",
              pillHover: "group-hover:border-[#ff4da6]/40 group-hover:bg-[#ff4da6]/10 group-hover:text-[#ff4da6] group-hover:shadow-[0_0_12px_rgba(255,77,166,0.25)]",
            },
            // Violet (#8a5cff)
            {
              baseShadow: "!shadow-[0_20px_60px_-20px_rgba(138,92,255,0.08),inset_0_0_0_1px_rgba(138,92,255,0.12)]",
              hoverShadow: "hover:!shadow-[0_28px_80px_-24px_rgba(138,92,255,0.22),inset_0_0_0_1px_rgba(138,92,255,0.3)]",
              iconHover: "group-hover:text-[#8a5cff] group-hover:drop-shadow-[0_0_8px_rgba(138,92,255,0.6)]",
              titleHover: "group-hover:text-[#8a5cff]",
              pillHover: "group-hover:border-[#8a5cff]/40 group-hover:bg-[#8a5cff]/10 group-hover:text-[#8a5cff] group-hover:shadow-[0_0_12px_rgba(138,92,255,0.25)]",
            }
          ];
          const styling = brandProfiles[index % brandProfiles.length];

          return (
            <Link
              key={item.slug}
              href={item.href}
              className={`panel panel-edge panel-hover focus-ring group relative flex flex-col gap-3 p-5 transition-all duration-300 md:p-6 ${styling.baseShadow} ${styling.hoverShadow}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <ArrowUpRight
                  className={`h-4 w-4 text-text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${styling.iconHover}`}
                  aria-hidden="true"
                />
              </div>

              <p className={`text-lg font-semibold leading-snug text-text-primary transition-colors ${styling.titleHover}`}>
                {item.label}
              </p>

              <p className="text-sm leading-relaxed text-text-secondary">
                {descriptions[locale][item.slug]}
              </p>

              <div className="mt-auto flex items-center gap-3 pt-4">
                <div className="hairline flex-1" aria-hidden="true" />
                <span className={`flex items-center justify-center rounded-full border border-border-strong bg-bg-base/60 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary transition-all duration-300 ${styling.pillHover}`}>
                  {copy.openSection}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
