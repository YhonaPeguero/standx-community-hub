import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  MessageSquareText
} from "lucide-react";
import {useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/request";
import HeroCanvas from "@/components/HeroCanvas";
import HeroBackdrop from "@/components/HeroBackdrop";

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
      className="relative isolate overflow-hidden pb-10 pt-6 md:pb-16 md:pt-10"
    >
      {/* Ambient professional backdrop: video (desktop only, below reduced-motion fallback),
          aurora blobs, and soft grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <HeroBackdrop />
        <div className="aurora aurora-cyan absolute -left-24 top-0 h-[28rem] w-[28rem]" />
        <div
          className="aurora aurora-violet absolute -right-24 top-10 h-[26rem] w-[26rem]"
          style={{animationDelay: "-4s"}}
        />
        <div
          className="aurora aurora-gain absolute left-1/3 top-[70%] h-[20rem] w-[20rem]"
          style={{animationDelay: "-8s"}}
        />
        <div className="bg-grid-soft absolute inset-0 opacity-70" />
      </div>

      <div className="section-shell relative">
        <div className="panel-glow relative overflow-hidden px-5 py-8 sm:px-7 md:px-10 md:py-14">
          <HeroCanvas />

          {/* Decorative mascot — floats in the right half on md+, watermark on mobile */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-[-6%] z-0 flex items-center md:right-[-4%]"
          >
            <div className="relative h-[26rem] w-[26rem] opacity-[0.22] blur-[1px] sm:opacity-30 md:h-[34rem] md:w-[34rem] md:opacity-70 md:blur-0">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(0,255,157,0.28) 0%, rgba(0,212,255,0.18) 35%, rgba(138,92,255,0.12) 60%, transparent 75%)",
                  filter: "blur(32px)"
                }}
              />
              {/* <Image
                src="/assets/standxProfile.png"
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 34rem, 26rem"
                className="animate-float select-none object-contain"
                style={{filter: "drop-shadow(0 30px 60px rgba(0, 255, 157, 0.25))"}}
              /> */}
            </div>
          </div>

          <div className="relative z-10 grid gap-10 md:grid-cols-[1.25fr_0.75fr] md:items-center md:gap-8">
            <div className="min-w-0 space-y-6">
              <p className="eyebrow">
                <span className="live-dot" aria-hidden="true" />
                {t("eyebrow")}
              </p>

              <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-text-primary sm:text-5xl md:text-[4rem]">
                <span className="block">{t("titlePartOne")}</span>
                <span className="block">{t("titlePartTwo")}</span>
                <span className="text-gradient block">{t("titleHighlight")}</span>
              </h1>

              <p className="max-w-xl text-pretty text-base font-medium leading-relaxed text-text-primary/80 md:text-lg">
                {t("description")}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={tLinks("startTrading")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={tCommon("startTradingAria")}
                  className="cta-primary focus-ring hidden min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-glow transition-transform hover:-translate-y-0.5 md:inline-flex"
                >
                  {t("ctaPrimary")}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>

                <Link
                  href={`/${locale}/how-it-works`}
                  aria-label={tCommon("learnHowAria")}
                  className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:text-accent-cyan"
                  style={{
                    boxShadow: "inset 0 0 0 1.5px rgba(148, 184, 232, 0.28)"
                  }}
                >
                  {t("ctaSecondary")}
                </Link>

                <a
                  href={tLinks("discord")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={tCommon("joinDiscord")}
                  className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                  style={{
                    background:
                      "linear-gradient(120deg, #5865f2 0%, #7289da 100%)"
                  }}
                >
                  <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                  {t("ctaCommunity")}
                </a>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="chip">{t("badges.free")}</span>
                <span className="chip">{t("badges.noLogin")}</span>
                <span className="chip">{t("badges.languages")}</span>
              </div>
            </div>

            <aside className="relative z-10 min-w-0">
              <div className="grid gap-3">
                <HeroMetric
                  label={t("stats.onboarding.label")}
                  value={
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      <span className="text-accent-gain drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]">SEED</span>
                      <span className="text-text-muted">{"->"}</span>
                      <span className="text-[#00d4ff] drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]">SPROUT</span>
                      <span className="text-text-muted">{"->"}</span>
                      <span className="text-[#ff4da6] drop-shadow-[0_0_8px_rgba(255,77,166,0.5)]">FLOWER</span>
                    </span>
                  }
                  hint={t("stats.onboarding.hint")}
                  accent="cyan"
                />
                <HeroMetric
                  label={t("stats.dusd.label")}
                  value={t("stats.dusd.value")}
                  hint={t("stats.dusd.hint")}
                  accent="gain"
                />
                <HeroMetric
                  label={t("stats.activity.label")}
                  value={t("stats.activity.value")}
                  hint={t("stats.activity.hint")}
                  accent="violet"
                />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <IconLink
                  href={tLinks("standxOfficial")}
                  label={tCommon("visitStandX")}
                  shortLabel="StandX"
                  icon={<ChartNoAxesCombined className="h-5 w-5 text-accent-cyan drop-shadow-md" aria-hidden="true" />}
                />
                <IconLink
                  href={tLinks("docs")}
                  label={tCommon("openDocs")}
                  shortLabel="Docs"
                  icon={<BookOpen className="h-5 w-5 text-accent-gain drop-shadow-md" aria-hidden="true" />}
                />
                <IconLink
                  href={tLinks("discord")}
                  label={tCommon("joinDiscord")}
                  shortLabel="Discord"
                  icon={<MessageSquareText className="h-5 w-5 text-[#5865f2] drop-shadow-md" aria-hidden="true" />}
                />
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile sticky CTA (docked under hero, not overlapping) */}
        <div className="mt-4 md:hidden">
          <a
            href={tLinks("startTrading")}
            target="_blank"
            rel="noreferrer"
            aria-label={tCommon("startTradingAria")}
            className="cta-primary focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-glow"
          >
            {t("mobileStickyCta")}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

interface HeroMetricProps {
  label: string;
  value: React.ReactNode;
  hint: string;
  accent: "cyan" | "gain" | "violet";
}

function HeroMetric({label, value, hint, accent}: HeroMetricProps) {
  const accentBar =
    accent === "cyan"
      ? "linear-gradient(180deg, #00d4ff, #64e6ff)"
      : accent === "gain"
        ? "linear-gradient(180deg, #00ff9d, #00d4ff)"
        : "linear-gradient(180deg, #8a5cff, #ff4da6)";

  return (
    <div
      className="group relative flex w-full min-w-0 gap-5 rounded-2xl p-5 backdrop-blur-md transition-colors hover:bg-white/[0.03] sm:p-6"
      style={{
        background:
          "linear-gradient(135deg, rgba(10, 16, 32, 0.55), rgba(6, 10, 22, 0.55))",
        boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.08)"
      }}
    >
      <span
        aria-hidden="true"
        className="mt-1 w-[3px] shrink-0 rounded-full"
        style={{background: accentBar, boxShadow: "0 0 10px currentColor"}}
      />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-accent-gain opacity-90 drop-shadow-[0_0_8px_rgba(0,255,157,0.4)]">
          {label}
        </p>
        <p className="mt-2 font-mono text-base font-semibold leading-relaxed text-text-primary sm:mt-2.5 sm:text-[1.1rem]">
          {value}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-text-secondary sm:mt-2.5">{hint}</p>
      </div>
    </div>
  );
}

interface IconLinkProps {
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

function IconLink({href, label, shortLabel, icon}: IconLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="focus-ring group relative inline-flex min-h-12 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-text-primary backdrop-blur-md transition-all hover:scale-105 hover:bg-white/[0.04]"
      style={{
        background: "linear-gradient(135deg, rgba(14, 20, 38, 0.7), rgba(9, 13, 26, 0.7))",
        boxShadow: "inset 0 0 0 1px rgba(100, 230, 255, 0.15), 0 4px 12px rgba(0,0,0,0.3)"
      }}
    >
      {icon}
      <span className="text-[10px] font-mono font-semibold uppercase tracking-wide opacity-90 transition group-hover:text-accent-cyan">
        {shortLabel}
      </span>
    </a>
  );
}
