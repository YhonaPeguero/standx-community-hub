import Link from "next/link";
import {CircleDollarSign, ShieldCheck} from "lucide-react";
import {useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/request";

interface DUSDSpotlightProps {
  locale: AppLocale;
}

export default function DUSDSpotlight({locale}: DUSDSpotlightProps) {
  const t = useTranslations("dusdSpotlight");
  const tLinks = useTranslations("links");

  return (
    <div className="section-shell" id="dusd-spotlight">
      <div className="relative overflow-hidden rounded-3xl border border-accent-cyan/35 bg-bg-surface/80 p-6 shadow-glow md:p-8">
        <div className="absolute -right-24 top-0 h-56 w-56 rounded-full bg-accent-cyan/20 blur-3xl" />

        <div className="relative z-10 grid gap-7 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-cyan">
              {t("eyebrow")}
            </p>
            <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">{t("title")}</h2>
            <p className="text-base leading-relaxed text-text-secondary">{t("description")}</p>

            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-accent-gain/35 bg-accent-gain/10 px-3 py-1 text-xs font-medium text-accent-gain">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t("callout")}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={tLinks("docs")}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-border-base bg-bg-base/65 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-accent-cyan/40 hover:text-accent-cyan"
                >
                  {t("ctaDocs")}
                </a>
                <Link
                  href={`/${locale}/how-it-works`}
                  className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-border-base bg-bg-base/65 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-accent-cyan/40 hover:text-accent-cyan"
                >
                  {t("ctaGuide")}
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border-base/80 bg-bg-base/70 p-5">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
              <CircleDollarSign className="h-4.5 w-4.5 text-accent-gain" aria-hidden="true" />
              {t("panel.title")}
            </p>
            <ul className="mt-4 space-y-3">
              <li className="rounded-xl border border-border-base/80 bg-bg-surface/70 px-3 py-2 text-sm leading-relaxed text-text-secondary">
                {t("panel.pointOne")}
              </li>
              <li className="rounded-xl border border-border-base/80 bg-bg-surface/70 px-3 py-2 text-sm leading-relaxed text-text-secondary">
                {t("panel.pointTwo")}
              </li>
              <li className="rounded-xl border border-border-base/80 bg-bg-surface/70 px-3 py-2 text-sm leading-relaxed text-text-secondary">
                {t("panel.pointThree")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
