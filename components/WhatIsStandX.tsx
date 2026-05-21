import {
  CandlestickChart,
  CircleDollarSign,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import {useTranslations} from "next-intl";

interface InfoCard {
  id: "perpetuals" | "dusd" | "selfCustody";
  icon: LucideIcon;
}

const infoCards: InfoCard[] = [
  {id: "perpetuals", icon: CandlestickChart},
  {id: "dusd", icon: CircleDollarSign},
  {id: "selfCustody", icon: ShieldCheck}
];

export default function WhatIsStandX() {
  const t = useTranslations("whatIsStandX");

  return (
    <section className="section-shell border-b border-border-hairline py-16 md:py-24" id="what-is-standx">
      <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
        <div className="space-y-4">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="text-display-md uppercase text-text-primary">{t("title")}</h2>
        </div>
        <div className="space-y-4">
          <p className="text-base leading-relaxed text-text-secondary md:text-lg">
            {t("sentenceOne")}
          </p>
          <p className="text-base leading-relaxed text-text-secondary">{t("sentenceTwo")}</p>
          <p className="text-base leading-relaxed text-text-secondary">{t("sentenceThree")}</p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 border border-border-hairline md:grid-cols-3">
        {infoCards.map(({id, icon: Icon}, index) => (
          <article
            key={id}
            className="border-border-hairline p-6 md:p-7 [&:not(:last-child)]:border-b md:[&:not(:last-child)]:border-b-0 md:[&:not(:last-child)]:border-r"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widercaps text-text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-mono text-base font-semibold uppercase tracking-widepill text-text-primary">
              {t(`cards.${id}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {t(`cards.${id}.description`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
