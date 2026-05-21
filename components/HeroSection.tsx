import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import {useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/request";

interface HeroSectionProps {
  locale: AppLocale;
}

export default function HeroSection({locale}: HeroSectionProps) {
  const t = useTranslations("hero");
  const tCommon = useTranslations("common");
  const tLinks = useTranslations("links");

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
        <div className="flex items-center gap-3 text-text-muted">
          <span className="font-mono text-[11px] uppercase tracking-widercaps">
            01 / Community Hub
          </span>
          <span className="hairline flex-1 max-w-[180px]" aria-hidden="true" />
          <span className="live-dot" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-widercaps text-accent-lime">
            {t("eyebrow")}
          </span>
        </div>

        <h1 className="mt-10 max-w-5xl text-balance text-display-2xl uppercase text-text-primary">
          {t("titlePartOne")} {t("titlePartTwo")}{" "}
          <span className="text-accent-lime">{t("titleHighlight")}</span>
        </h1>

        <p className="mt-8 max-w-2xl text-pretty text-base leading-relaxed text-text-secondary md:text-lg">
          {t("description")}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
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

      {/* Mono stat strip — trading-terminal feel. Three columns separated by
          hairlines, content reads as a deck row not a card stack. */}
      <div className="border-t border-border-hairline">
        <div className="section-shell">
          <dl className="grid grid-cols-1 divide-y divide-border-hairline md:grid-cols-3 md:divide-x md:divide-y-0">
            <HeroStat
              index="01"
              label={t("stats.onboarding.label")}
              value={t("stats.onboarding.value")}
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
              hint={t("stats.activity.hint")}
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
  value: string;
  hint: string;
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
