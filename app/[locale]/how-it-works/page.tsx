import Link from "next/link";
import type {Metadata} from "next";
import {useTranslations} from "next-intl";
import {getTranslations} from "next-intl/server";
import {
  ArrowUpRight,
  CandlestickChart,
  HandCoins,
  Wallet,
  type LucideIcon
} from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import {defaultLocale, isAppLocale} from "@/i18n/request";

interface HowItWorksPageProps {
  params: {
    locale: string;
  };
}

interface StepData {
  id: "connect" | "deposit" | "trade";
  icon: LucideIcon;
}

const steps: StepData[] = [
  {id: "connect", icon: Wallet},
  {id: "deposit", icon: HandCoins},
  {id: "trade", icon: CandlestickChart}
];

export async function generateMetadata({
  params
}: HowItWorksPageProps): Promise<Metadata> {
  const locale = isAppLocale(params.locale) ? params.locale : defaultLocale;
  const t = await getTranslations({locale, namespace: "metadata.howItWorks"});

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      locale
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription")
    }
  };
}

export default function HowItWorksPage({params}: HowItWorksPageProps) {
  const locale = isAppLocale(params.locale) ? params.locale : defaultLocale;
  const t = useTranslations("howItWorksPage");
  const tCommon = useTranslations("common");
  const tLinks = useTranslations("links");

  return (
    <>
      <SectionReveal>
        <section className="section-shell border-b border-border-hairline py-16 md:py-24">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-text-muted">
            <span className="hidden font-mono text-[11px] uppercase tracking-widercaps md:inline">
              02 / Onboarding
            </span>
            <span className="hairline hidden max-w-[180px] flex-1 md:block" aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-widercaps text-accent-lime">
              {t("eyebrow")}
            </span>
          </div>

          <h1 className="mt-10 max-w-4xl text-balance text-display-xl uppercase text-text-primary">
            {t("title")}
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
            {t("description")}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={tLinks("startTrading")}
              target="_blank"
              rel="noreferrer"
              aria-label={tCommon("startTradingAria")}
              className="btn btn-primary"
            >
              {t("primaryCta")}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>

            <Link href={`/${locale}`} className="btn btn-secondary">
              {t("secondaryCta")}
            </Link>
          </div>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="section-shell border-b border-border-hairline py-16 md:py-24">
          <div className="grid grid-cols-1 border border-border-hairline md:grid-cols-3">
            {steps.map(({id, icon: Icon}, index) => (
              <article
                key={id}
                className="border-border-hairline p-7 [&:not(:last-child)]:border-b md:[&:not(:last-child)]:border-b-0 md:[&:not(:last-child)]:border-r"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-4xl font-bold text-accent-lime">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                </div>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-widercaps text-text-muted">
                  {t(`steps.${id}.number`)}
                </p>
                <h2 className="mt-2 font-mono text-base font-semibold uppercase tracking-widepill text-text-primary">
                  {t(`steps.${id}.title`)}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {t(`steps.${id}.description`)}
                </p>
                <div className="hairline my-5" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-text-secondary">
                  {t(`steps.${id}.whyItMatters`)}
                </p>
              </article>
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="section-shell border-b border-border-hairline py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
            <div className="space-y-4">
              <p className="eyebrow">Glossary</p>
              <h2 className="text-display-md uppercase text-text-primary">
                {t("terms.title")}
              </h2>
            </div>
            <p className="text-base leading-relaxed text-text-secondary md:text-lg">
              {t("terms.subtitle")}
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-1 border border-border-hairline md:grid-cols-2">
            {[
              {key: "perpetuals"},
              {key: "collateral"},
              {key: "yield"},
              {key: "risk"}
            ].map(({key}, index) => (
              <div
                key={key}
                className="border-border-hairline p-6 md:p-7 [&:not(:last-child)]:border-b md:[&:nth-child(odd)]:border-r md:[&:nth-child(-n+2)]:border-b"
              >
                <div className="flex items-center justify-between">
                  <dt className="font-mono text-[11px] uppercase tracking-widercaps text-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </dt>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-widepill text-accent-lime">
                    {t(`terms.${key}.label`)}
                  </p>
                </div>
                <dd className="mt-4 text-sm leading-relaxed text-text-secondary">
                  {t(`terms.${key}.definition`)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="section-shell border-b border-border-hairline py-20 md:py-28">
          <div className="border border-accent-lime/40 p-8 md:p-12">
            <h2 className="text-display-md uppercase text-text-primary">
              {t("finalBlock.title")}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
              {t("finalBlock.description")}
            </p>
            <a
              href={tLinks("discord")}
              target="_blank"
              rel="noreferrer"
              aria-label={tCommon("joinDiscord")}
              className="btn btn-primary mt-8"
            >
              {t("finalBlock.cta")}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </SectionReveal>
    </>
  );
}
