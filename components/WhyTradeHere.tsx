import {
  BadgeDollarSign,
  CandlestickChart,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import {useTranslations} from "next-intl";
import ScrollRevealImage from "@/components/ScrollRevealImage";

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
    <div className="section-shell relative" id="why-trade-here">
      {/* Scroll-reveal accent */}
      <ScrollRevealImage
        src="/assets/tryhardtraderstandx.png"
        alt=""
        width={300}
        height={300}
        direction="left"
        threshold={0.15}
        wrapperClassName="pointer-events-none absolute -bottom-10 -left-12 -z-10 hidden select-none lg:block"
        wrapperStyle={{
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 15%, transparent 65%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 15%, transparent 65%)"
        }}
        className="h-[300px] w-[300px] object-contain opacity-[0.14]"
      />

      <div className="space-y-4 relative z-10">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-cyan">
          {t("eyebrow")}
        </p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">{t("title")}</h2>
        <p className="max-w-3xl text-base leading-relaxed text-text-secondary">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {valueCards.map(({id, icon: Icon}) => (
          <article
            key={id}
            className="rounded-2xl border border-border-base/80 bg-bg-surface/70 p-5"
          >
            <Icon className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-text-primary">
              {t(`cards.${id}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {t(`cards.${id}.description`)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
