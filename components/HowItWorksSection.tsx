import {
  HandCoins,
  TrendingUpDown,
  Wallet,
  type LucideIcon
} from "lucide-react";
import {useTranslations} from "next-intl";

interface StepItem {
  id: "connect" | "deposit" | "trade";
  icon: LucideIcon;
}

const steps: StepItem[] = [
  {id: "connect", icon: Wallet},
  {id: "deposit", icon: HandCoins},
  {id: "trade", icon: TrendingUpDown}
];

export default function HowItWorksSection() {
  const t = useTranslations("howItWorksSection");

  return (
    <section className="section-shell border-b border-border-hairline py-16 md:py-24" id="how-it-works-home">
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
        {steps.map(({id, icon: Icon}) => (
          <article
            key={id}
            className="border-border-hairline p-6 md:p-7 [&:not(:last-child)]:border-b md:[&:not(:last-child)]:border-b-0 md:[&:not(:last-child)]:border-r"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-3xl font-bold text-accent-lime">
                {t(`steps.${id}.number`)}
              </span>
              <Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-mono text-base font-semibold uppercase tracking-widepill text-text-primary">
              {t(`steps.${id}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {t(`steps.${id}.description`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
