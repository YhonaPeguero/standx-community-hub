import {BarChart3, Users, WalletCards, type LucideIcon} from "lucide-react";
import {useTranslations} from "next-intl";

interface StatItem {
  id: "totalVolume" | "activeTraders" | "communityMembers";
  icon: LucideIcon;
}

const stats: StatItem[] = [
  {id: "totalVolume", icon: BarChart3},
  {id: "activeTraders", icon: WalletCards},
  {id: "communityMembers", icon: Users}
];

export default function StatsSection() {
  const t = useTranslations("statsSection");
  const tCommon = useTranslations("common");

  return (
    <div className="section-shell" id="stats">
      <div className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-cyan">
          {t("eyebrow")}
        </p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">{t("title")}</h2>
        <p className="max-w-3xl text-base leading-relaxed text-text-secondary">
          {t("subtitle")}
        </p>
      </div>

      <p className="mt-4 text-sm text-text-muted">{tCommon("approximateValues")}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {stats.map(({id, icon: Icon}) => (
          <article
            key={id}
            className="rounded-2xl border border-border-base/80 bg-bg-surface/70 p-5"
          >
            <Icon className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-text-muted">
              {t(`items.${id}.label`)}
            </p>
            <p className="mt-2 text-3xl font-semibold text-text-primary">
              {t(`items.${id}.value`)}
            </p>
            <p className="mt-2 text-sm text-text-secondary">{t(`items.${id}.note`)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
