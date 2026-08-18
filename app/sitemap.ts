import type {MetadataRoute} from "next";
import {locales} from "@/i18n/request";
import {SITE_URL, seoPaths, sitemapLanguages} from "@/lib/seo";

/**
 * Every page, in every locale, with its translations named alongside it.
 *
 * The hub is already crawlable — the navbar and footer link every section from
 * every page — so this is not what makes the pages reachable. What it adds is
 * the `alternates` block per entry, which repeats the hreflang relationships in
 * a second place, and a single list Search Console can report coverage against.
 *
 * `/motion-lab` is deliberately absent: it is a development tool that lives
 * outside `app/[locale]` and has no business in an index. `robots.ts` disallows
 * it as well.
 *
 * `lastModified` is the build time rather than a per-page date. A page's real
 * edit date is not tracked anywhere, and inventing a fresher one per route
 * would be a lie told to a crawler that checks.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return seoPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path ? `/${path}` : ""}`,
      lastModified,
      changeFrequency: "weekly" as const,
      // The home page of each locale is the entry point; sections sit below it.
      priority: path === "" ? 1 : 0.8,
      alternates: {languages: sitemapLanguages(path)}
    }))
  );
}
