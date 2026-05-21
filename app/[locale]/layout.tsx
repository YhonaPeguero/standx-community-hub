import type {Metadata} from "next";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollProgress from "@/components/ScrollProgress";
import SplashIntro from "@/components/SplashIntro";
import {
  defaultLocale,
  isAppLocale,
  locales,
  type AppLocale
} from "@/i18n/request";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params
}: Omit<LocaleLayoutProps, "children">): Promise<Metadata> {
  const locale = isAppLocale(params.locale) ? params.locale : defaultLocale;
  const t = await getTranslations({locale, namespace: "metadata.layout"});

  return {
    title: "StandX Community Hub",
    description: t("description"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      locale,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription")
    }
  };
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const localeParam = params.locale;

  if (!isAppLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as AppLocale;
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="relative flex min-h-screen flex-col">
        <SplashIntro />
        <ScrollProgress />
        <Navbar locale={locale} />
        <main className="flex-1 pt-[60px] md:pt-[64px]">
          <div className="locale-fade">{children}</div>
        </main>
        <Footer locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
