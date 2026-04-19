import {getRequestConfig} from "next-intl/server";

export const locales = ["en", "es", "pt-br", "uk", "ko"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export function isAppLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = requested && isAppLocale(requested) ? requested : defaultLocale;

  const messagesModule = await import(`../messages/${locale}.json`).catch(() =>
    import("../messages/en.json")
  );

  return {
    locale,
    messages: messagesModule.default
  };
});
