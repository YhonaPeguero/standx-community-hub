import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import {useTranslations} from "next-intl";
import type {ReactNode} from "react";
import type {AppLocale} from "@/i18n/request";

interface HeroSectionProps {
  locale: AppLocale;
}

/**
 * Community-defined tier colors for the Growth Path stat. These are brand
 * conventions, not theme tokens — keep them in sync with how the StandX
 * Discord uses them.
 */
const GROWTH_TIER_COLORS = {
  seed: "#00ff87", // green — lime/brand
  sprout: "#5ec2ff", // azul cielo
  flower: "#f472b6" // rosado
} as const;

export default function HeroSection({locale}: HeroSectionProps) {
  const t = useTranslations("hero");
  const tCommon = useTranslations("common");
  const tLinks = useTranslations("links");

  // The translated `stats.onboarding.value` is literally "SEED -> SPROUT -> FLOWER".
  // Render it as JSX so each tier gets its community color instead of one flat lime.
  const growthValue: ReactNode = (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        style={{color: GROWTH_TIER_COLORS.seed, textShadow: `0 0 12px ${GROWTH_TIER_COLORS.seed}55`}}
      >
        SEED
      </span>
      <span className="text-text-muted">→</span>
      <span
        style={{color: GROWTH_TIER_COLORS.sprout, textShadow: `0 0 12px ${GROWTH_TIER_COLORS.sprout}55`}}
      >
        SPROUT
      </span>
      <span className="text-text-muted">→</span>
      <span
        style={{color: GROWTH_TIER_COLORS.flower, textShadow: `0 0 12px ${GROWTH_TIER_COLORS.flower}55`}}
      >
        FLOWER
      </span>
    </span>
  );

  const discordUrl = tLinks("discord");
  const activityHint: ReactNode = (
    <a
      href={discordUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={tCommon("joinDiscord")}
      className="focus-ring inline-flex items-center gap-1 underline decoration-text-muted/60 decoration-1 underline-offset-4 transition hover:text-accent-lime hover:decoration-accent-lime"
    >
      {t("stats.activity.hint")}
      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
    </a>
  );

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden border-b border-border-hairline"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 grid-mesh opacity-50"
      />

      <div className="section-shell relative py-16 md:py-24 lg:py-32">
        <div
          className="animate-fade-up flex items-center gap-3 text-text-muted"
          style={{animationDelay: "0ms"}}
        >
          <span className="font-mono text-[11px] uppercase tracking-widercaps">
            01 / Community Hub
          </span>
          <span className="hairline flex-1 max-w-[180px]" aria-hidden="true" />
          <span className="live-dot" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-widercaps text-accent-lime">
            {t("eyebrow")}
          </span>
        </div>

        <h1
          className="animate-rise-lg mt-10 max-w-5xl text-balance text-display-2xl uppercase text-text-primary"
          style={{animationDelay: "120ms"}}
        >
          {t("titlePartOne")} {t("titlePartTwo")}{" "}
          <span className="text-accent-lime">{t("titleHighlight")}</span>
        </h1>

        <p
          className="animate-fade-up mt-8 max-w-2xl text-pretty text-base leading-relaxed text-text-secondary md:text-lg"
          style={{animationDelay: "320ms"}}
        >
          {t("description")}
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-wrap items-center gap-3"
          style={{animationDelay: "460ms"}}
        >
          <a
            href={tLinks("startTrading")}
            target="_blank"
            rel="noreferrer"
            aria-label={tCommon("startTradingAria")}
            className="btn btn-primary"
          >
            {t("ctaPrimary")}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>

          <Link
            href={`/${locale}/how-it-works`}
            aria-label={tCommon("learnHowAria")}
            className="btn btn-secondary"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </div>

      <div
        className="animate-fade-up border-t border-border-hairline"
        style={{animationDelay: "620ms"}}
      >
        <div className="section-shell">
          <dl className="grid grid-cols-1 divide-y divide-border-hairline md:grid-cols-3 md:divide-x md:divide-y-0">
            <HeroStat
              index="01"
              label={t("stats.onboarding.label")}
              value={growthValue}
              hint={t("stats.onboarding.hint")}
            />
            <HeroStat
              index="02"
              label={t("stats.dusd.label")}
              value={t("stats.dusd.value")}
              hint={t("stats.dusd.hint")}
            />
            <HeroStat
              index="03"
              label={t("stats.activity.label")}
              value={t("stats.activity.value")}
              hint={activityHint}
            />
          </dl>
        </div>
      </div>
    </section>
  );
}

interface HeroStatProps {
  index: string;
  label: string;
  value: ReactNode;
  hint: ReactNode;
}

function HeroStat({index, label, value, hint}: HeroStatProps) {
  return (
    <div className="flex flex-col gap-3 px-0 py-7 md:px-8">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widercaps text-text-muted">
          {index}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widepill text-accent-lime">
          {label}
        </span>
      </div>
      <dd className="font-mono text-base font-medium text-text-primary md:text-lg">
        {value}
      </dd>
      <dt className="text-sm leading-relaxed text-text-secondary">{hint}</dt>
    </div>
  );
}
