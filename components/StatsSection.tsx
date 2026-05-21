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
    <section className="section-shell border-b border-border-hairline py-16 md:py-24" id="stats">
      <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
        <div className="space-y-4">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="text-display-md uppercase text-text-primary">{t("title")}</h2>
        </div>
        <div className="space-y-3">
          <p className="text-base leading-relaxed text-text-secondary md:text-lg">
            {t("subtitle")}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-widercaps text-text-muted">
            {tCommon("approximateValues")}
          </p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 border border-border-hairline md:grid-cols-3">
        {stats.map(({id, icon: Icon}, index) => (
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
            <p className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-widepill text-accent-lime">
              {t(`items.${id}.label`)}
            </p>
            <p className="mt-2 font-mono text-4xl font-bold text-text-primary">
              {t(`items.${id}.value`)}
            </p>
            <p className="mt-2 text-sm text-text-secondary">{t(`items.${id}.note`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
