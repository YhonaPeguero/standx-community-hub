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
    <section className="section-shell border-b border-border-hairline py-16 md:py-24" id="dusd-spotlight">
      <div className="grid gap-12 border border-border-hairline md:grid-cols-[1.1fr_0.9fr] md:gap-0">
        <div className="space-y-5 p-8 md:p-10 md:border-r md:border-border-hairline">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="text-display-md uppercase text-text-primary">{t("title")}</h2>
          <p className="text-base leading-relaxed text-text-secondary">{t("description")}</p>

          <p className="inline-flex items-center gap-2 border border-accent-lime/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widepill text-accent-lime">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t("callout")}
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href={tLinks("docs")}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              {t("ctaDocs")}
            </a>
            <Link href={`/${locale}/how-it-works`} className="btn btn-secondary">
              {t("ctaGuide")}
            </Link>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-widepill text-text-primary">
            <CircleDollarSign className="h-4 w-4 text-accent-lime" aria-hidden="true" />
            {t("panel.title")}
          </p>
          <ul className="mt-5 space-y-px">
            <li className="border border-border-hairline px-4 py-3 text-sm leading-relaxed text-text-secondary">
              <span className="mr-2 font-mono text-[11px] tracking-widercaps text-text-muted">01</span>
              {t("panel.pointOne")}
            </li>
            <li className="border border-border-hairline border-t-0 px-4 py-3 text-sm leading-relaxed text-text-secondary">
              <span className="mr-2 font-mono text-[11px] tracking-widercaps text-text-muted">02</span>
              {t("panel.pointTwo")}
            </li>
            <li className="border border-border-hairline border-t-0 px-4 py-3 text-sm leading-relaxed text-text-secondary">
              <span className="mr-2 font-mono text-[11px] tracking-widercaps text-text-muted">03</span>
              {t("panel.pointThree")}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
