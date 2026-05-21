import {
  BadgeDollarSign,
  CandlestickChart,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import {useTranslations} from "next-intl";

interface ValueCard {
  id: "perpetualContracts" | "dusdYield" | "decentralizedSecure";
  icon: LucideIcon;
}

const valueCards: ValueCard[] = [
  {id: "perpetualContracts", icon: CandlestickChart},
  {id: "dusdYield", icon: BadgeDollarSign},
  {id: "decentralizedSecure", icon: ShieldCheck}
];

export default function WhyTradeHere() {
  const t = useTranslations("whyTradeHere");

  return (
    <section className="section-shell border-b border-border-hairline py-16 md:py-24" id="why-trade-here">
      <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
        <div className="space-y-4">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="text-display-md uppercase text-text-primary">{t("title")}</h2>
        </div>
        <p className="text-base leading-relaxed text-text-secondary md:text-lg">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 border border-border-hairline md:grid-cols-3">
        {valueCards.map(({id, icon: Icon}, index) => (
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
