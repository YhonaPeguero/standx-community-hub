import {defaultLocale, locales, type AppLocale} from "@/i18n/request";
import {hubSections} from "@/lib/hub-navigation";

/**
 * The canonical origin, in one place.
 *
 * `app/layout.tsx` feeds it to `metadataBase`, and the sitemap and robots
 * routes build absolute URLs from it — those two generate plain text and XML,
 * so `metadataBase` cannot help them. Moving the site to its own domain is then
 * one edit rather than a search for every place the host was spelled out.
 */
export const SITE_URL = "https://standx-community-hub.vercel.app";

/**
 * hreflang wants BCP 47, where the region subtag is uppercase — `pt-BR`, not
 * the `pt-br` we use as a route segment. Google is forgiving about the case but
 * the validators are not, and the two are not interchangeable anywhere else.
 */
const HREFLANG: Record<AppLocale, string> = {
  en: "en",
  es: "es",
  "pt-br": "pt-BR",
  uk: "uk",
  ko: "ko",
  ja: "ja"
};

/** Every indexable path, without its locale prefix. */
export const seoPaths: readonly string[] = ["", "how-it-works", ...hubSections];

function href(locale: AppLocale, path: string): string {
  return `/${locale}${path ? `/${path}` : ""}`;
}

/**
 * Tells search engines that the six locale copies of a page are translations of
 * each other rather than six pages competing to say the same thing.
 *
 * Without this a crawler sees `/en/getting-started` and `/ja/getting-started`
 * as duplicates, picks one as canonical — in practice the most-linked, which is
 * English — and the other five barely surface. It also decides which one to
 * serve: a reader searching in Japanese should land on `/ja`, not on `/en`.
 *
 * `x-default` is the fallback for a language we do not publish, and points at
 * the default locale.
 *
 * Deliberately NOT set on the locale layout. Metadata merges field by field, so
 * a layout-level `alternates` would be inherited by any page that does not set
 * its own — and it would name the layout's path, quietly claiming that
 * `/es/brand-kit` is the Spanish version of the home page. A page that forgets
 * to call this ends up with no alternates, which is merely incomplete rather
 * than wrong.
 *
 * URLs are relative on purpose: `metadataBase` resolves them, so the origin
 * stays declared once.
 */
export function alternatesFor(locale: AppLocale, path = "") {
  const languages: Record<string, string> = {};
  for (const candidate of locales) {
    languages[HREFLANG[candidate]] = href(candidate, path);
  }
  languages["x-default"] = href(defaultLocale, path);

  return {
    canonical: href(locale, path),
    languages
  };
}

/** The same map, absolute, for the sitemap's `<xhtml:link>` entries. */
export function sitemapLanguages(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const candidate of locales) {
    languages[HREFLANG[candidate]] = `${SITE_URL}${href(candidate, path)}`;
  }
  languages["x-default"] = `${SITE_URL}${href(defaultLocale, path)}`;
  return languages;
}
