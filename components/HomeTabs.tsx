import Link from "next/link";
import {useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/request";

interface HomeTabsProps {
  locale: AppLocale;
}

export default function HomeTabs({locale}: HomeTabsProps) {
  const t = useTranslations("homeTabs");

  const tabs = [
    {href: `/${locale}#overview`, label: t("gettingStarted")},
    {href: `/${locale}#why-trade-here`, label: t("whyTrade")},
    {href: `/${locale}#how-it-works-home`, label: t("howItWorks")},
    {href: `/${locale}#community`, label: t("community")},
    {href: `/${locale}#resources`, label: t("resources")},
    {href: `/${locale}#about`, label: t("about")}
  ];

  return (
    <div className="border-y border-border-hairline">
      <div className="section-shell overflow-x-auto">
        <nav className="flex min-h-[52px] min-w-max items-center gap-1 py-1">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href} className="nav-pill">
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
