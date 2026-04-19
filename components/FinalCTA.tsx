import {ArrowUpRight} from "lucide-react";
import {useTranslations} from "next-intl";

export default function FinalCTA() {
  const t = useTranslations("finalCta");
  const tCommon = useTranslations("common");
  const tLinks = useTranslations("links");

  return (
    <div className="section-shell" id="final-cta">
      <div className="rounded-3xl border border-accent-cyan/30 bg-bg-surface/80 px-6 py-8 shadow-glow md:px-8">
        <h2 className="max-w-3xl text-balance text-2xl font-semibold text-text-primary md:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
          {t("subtitle")}
        </p>

        <a
          href={tLinks("startTrading")}
          target="_blank"
          rel="noreferrer"
          aria-label={tCommon("startTradingAria")}
          className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-cyan px-5 py-2.5 font-semibold text-bg-base transition hover:bg-accent-cyanSoft"
        >
          {t("cta")}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
