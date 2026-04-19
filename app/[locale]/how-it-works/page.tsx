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
    <div className="space-y-12 pb-10 pt-8 md:space-y-16 md:pb-16 md:pt-10">
      <SectionReveal>
        <div className="section-shell relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="aurora aurora-cyan absolute -left-24 top-0 h-[22rem] w-[22rem]" />
            <div
              className="aurora aurora-violet absolute -right-24 top-10 h-[20rem] w-[20rem]"
              style={{animationDelay: "-5s"}}
            />
          </div>

          <div className="space-y-5">
            <p className="eyebrow">
              <span className="live-dot" aria-hidden="true" />
              {t("eyebrow")}
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-text-primary md:text-5xl">
              {t("title")}
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-text-secondary md:text-lg">
              {t("description")}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={tLinks("startTrading")}
                target="_blank"
                rel="noreferrer"
                aria-label={tCommon("startTradingAria")}
                className="cta-primary focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-glow"
              >
                {t("primaryCta")}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>

              <Link
                href={`/${locale}`}
                className="focus-ring inline-flex min-h-11 items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:text-accent-cyan"
                style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.14)"}}
              >
                {t("secondaryCta")}
              </Link>
            </div>
          </div>
        </div>
      </SectionReveal>

      <SectionReveal>
        <div className="section-shell">
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map(({id, icon: Icon}, index) => (
              <article
                key={id}
                className="panel panel-edge panel-hover group relative p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
                    {String(index + 1).padStart(2, "0")} · {t(`steps.${id}.number`)}
                  </span>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(138,92,255,0.12))",
                      boxShadow: "inset 0 0 0 1px rgba(0, 212, 255, 0.25)"
                    }}
                  >
                    <Icon className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
                  </div>
                </div>

                <h2 className="mt-4 text-lg font-semibold text-text-primary transition-colors group-hover:text-accent-cyan">
                  {t(`steps.${id}.title`)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {t(`steps.${id}.description`)}
                </p>

                <div className="hairline my-4" aria-hidden="true" />

                <p className="text-sm leading-relaxed text-text-secondary">
                  {t(`steps.${id}.whyItMatters`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </SectionReveal>

      <SectionReveal>
        <div className="section-shell space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
              {t("terms.title")}
            </h2>
            <p className="max-w-3xl text-base leading-relaxed text-text-secondary">
              {t("terms.subtitle")}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              {key: "perpetuals"},
              {key: "collateral"},
              {key: "yield"},
              {key: "risk"}
            ].map(({key}) => (
              <article key={key} className="panel panel-hover p-5">
                <p className="eyebrow">{t(`terms.${key}.label`)}</p>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {t(`terms.${key}.definition`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </SectionReveal>

      <SectionReveal>
        <div className="section-shell">
          <div
            className="relative overflow-hidden rounded-3xl p-6 md:p-10"
            style={{
              background:
                "radial-gradient(ellipse 70% 90% at 20% 0%, rgba(0,255,157,0.15), transparent 60%), radial-gradient(ellipse 70% 80% at 90% 100%, rgba(0,212,255,0.1), transparent 60%), linear-gradient(180deg, rgba(10,18,28,0.85), rgba(6,11,20,0.85))",
              boxShadow: "inset 0 0 0 1px rgba(0, 255, 157, 0.22)"
            }}
          >
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
              {t("finalBlock.title")}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
              {t("finalBlock.description")}
            </p>

            <a
              href={tLinks("discord")}
              target="_blank"
              rel="noreferrer"
              aria-label={tCommon("joinDiscord")}
              className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:text-accent-cyan"
              style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.16)"}}
            >
              {t("finalBlock.cta")}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </SectionReveal>
    </div>
  );
}
