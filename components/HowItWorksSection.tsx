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
    <div className="section-shell" id="how-it-works-home">
      <div className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-cyan">
          {t("eyebrow")}
        </p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">{t("title")}</h2>
        <p className="max-w-3xl text-base leading-relaxed text-text-secondary">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {steps.map(({id, icon: Icon}) => (
          <article
            key={id}
            className="relative rounded-2xl border border-border-base/80 bg-bg-surface/70 p-5"
          >
            <div className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-accent-cyan/15 px-2 font-mono text-xs font-semibold text-accent-cyan">
              {t(`steps.${id}.number`)}
            </div>

            <Icon className="mt-4 h-5 w-5 text-accent-gain" aria-hidden="true" />

            <h3 className="mt-3 text-base font-semibold text-text-primary">
              {t(`steps.${id}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {t(`steps.${id}.description`)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
