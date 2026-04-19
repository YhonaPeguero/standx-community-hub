import createMiddleware from "next-intl/middleware";
import {defaultLocale, locales} from "@/i18n/request";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
  localeCookie: {
    name: "standx-hub-locale",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/"
  }
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"]
};
