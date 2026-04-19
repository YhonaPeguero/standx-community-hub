import {
  CandlestickChart,
  CircleDollarSign,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import {useTranslations} from "next-intl";
import ScrollRevealImage from "@/components/ScrollRevealImage";

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
    <div className="section-shell relative" id="what-is-standx">
      {/* Scroll-reveal accent */}
      <ScrollRevealImage
        src="/assets/bearmarket.png"
        alt=""
        width={340}
        height={340}
        direction="right"
        threshold={0.15}
        wrapperClassName="pointer-events-none absolute -bottom-16 -right-12 -z-10 hidden select-none lg:block"
        wrapperStyle={{
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 15%, transparent 65%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 15%, transparent 65%)"
        }}
        className="h-[340px] w-[340px] object-contain opacity-[0.12]"
      />

      <div className="glass-panel p-6 md:p-8 relative z-10">
        <div className="max-w-3xl space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-cyan">
            {t("eyebrow")}
          </p>
          <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
            {t("title")}
          </h2>
          <p className="text-base leading-relaxed text-text-secondary">{t("sentenceOne")}</p>
          <p className="text-base leading-relaxed text-text-secondary">{t("sentenceTwo")}</p>
          <p className="text-base leading-relaxed text-text-secondary">{t("sentenceThree")}</p>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {infoCards.map(({id, icon: Icon}) => (
            <article
              key={id}
              className="rounded-2xl border border-border-base/80 bg-bg-surface/70 p-4"
            >
              <Icon className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-text-primary">
                {t(`cards.${id}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t(`cards.${id}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
