import {ArrowUpRight} from "lucide-react";
import {useTranslations} from "next-intl";

export default function FinalCTA() {
  const t = useTranslations("finalCta");
  const tCommon = useTranslations("common");
  const tLinks = useTranslations("links");

  return (
    <section className="section-shell border-b border-border-hairline py-20 md:py-32" id="final-cta">
      <div className="border border-border-hairline">
        <div className="grid gap-10 p-8 md:grid-cols-[1.3fr_0.7fr] md:items-end md:p-12">
          <div className="space-y-5">
            <span className="font-mono text-[11px] uppercase tracking-widercaps text-text-muted">
              / End transmission
            </span>
            <h2 className="text-display-lg uppercase text-text-primary">{t("title")}</h2>
            <p className="max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
              {t("subtitle")}
            </p>
          </div>

          <a
            href={tLinks("startTrading")}
            target="_blank"
            rel="noreferrer"
            aria-label={tCommon("startTradingAria")}
            className="btn btn-primary w-full md:w-auto md:self-end"
          >
            {t("cta")}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
