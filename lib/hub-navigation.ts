import type {AppLocale} from "@/i18n/request";

export const hubSections = [
  "getting-started",
  "brand-kit",
  "templates",
  "references",
  "community",
  "standers-insights",
  "about"
] as const;

export type HubSectionSlug = (typeof hubSections)[number];

export interface HubNavItem {
  slug: HubSectionSlug;
  href: string;
  label: string;
}

const sectionLabels: Record<AppLocale, Record<HubSectionSlug, string>> = {
  en: {
    "getting-started": "Getting Started",
    "brand-kit": "Brand Kit",
    templates: "Templates",
    references: "References",
    community: "Community",
    "standers-insights": "Standers Insights",
    about: "About"
  },
  es: {
    "getting-started": "Como Empezar",
    "brand-kit": "Brand Kit",
    templates: "Plantillas",
    references: "Referencias",
    community: "Comunidad",
    "standers-insights": "Standers Insights",
    about: "Acerca de"
  },
  "pt-br": {
    "getting-started": "Como Comecar",
    "brand-kit": "Brand Kit",
    templates: "Templates",
    references: "Referencias",
    community: "Comunidade",
    "standers-insights": "Standers Insights",
    about: "Sobre"
  },
  uk: {
    "getting-started": "Початок",
    "brand-kit": "Brand Kit",
    templates: "Шаблони",
    references: "Приклади",
    community: "Спільнота",
    "standers-insights": "Standers Insights",
    about: "Про хаб"
  },
  ko: {
    "getting-started": "시작 가이드",
    "brand-kit": "브랜드 키트",
    templates: "템플릿",
    references: "레퍼런스",
    community: "커뮤니티",
    "standers-insights": "Standers Insights",
    about: "소개"
  }
};

export function getHubNavItems(locale: AppLocale): HubNavItem[] {
  return hubSections.map((slug) => ({
    slug,
    href: `/${locale}/${slug}`,
    label: sectionLabels[locale][slug]
  }));
}

export function isHubSectionSlug(value: string): value is HubSectionSlug {
  return hubSections.includes(value as HubSectionSlug);
}
