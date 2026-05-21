import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import HeroSection from "@/components/HeroSection";
import SectionReveal from "@/components/SectionReveal";
import SectionDirectory from "@/components/SectionDirectory";
import {defaultLocale, isAppLocale, type AppLocale} from "@/i18n/request";

interface HomePageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({params}: HomePageProps): Promise<Metadata> {
  const locale = isAppLocale(params.locale) ? params.locale : defaultLocale;
  const t = await getTranslations({locale, namespace: "metadata.home"});

  return {
    title: {
      absolute: "StandX Community Hub"
    },
    description: t("description"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      locale
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription")
    }
  };
}

export default function HomePage({params}: HomePageProps) {
  const locale = isAppLocale(params.locale)
    ? (params.locale as AppLocale)
    : defaultLocale;

  return (
    <div>
      <HeroSection locale={locale} />

      <SectionReveal id="overview">
        <SectionDirectory locale={locale} />
      </SectionReveal>
    </div>
  );
}
