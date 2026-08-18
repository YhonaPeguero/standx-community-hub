import type {MetadataRoute} from "next";
import {SITE_URL} from "@/lib/seo";

/**
 * Two exclusions, both for things that are not pages.
 *
 * `/api/` is the assistant's streaming endpoint — it answers POSTs with SSE and
 * has nothing for a crawler to read. `/motion-lab` is the character-motion
 * development tool; it renders WebGL, weighs 145kB of JavaScript, and is not
 * part of what the hub is for.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/motion-lab"]
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
