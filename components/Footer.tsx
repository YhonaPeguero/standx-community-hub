"use client";

import Link from "next/link";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  Globe2,
  MessageSquareText
} from "lucide-react";
import {useMemo, type ChangeEvent} from "react";
import {useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/request";
import {getHubNavItems} from "@/lib/hub-navigation";

interface FooterProps {
  locale: AppLocale;
}

interface LocaleOption {
  value: AppLocale;
  codeKey:
    | "languageCodeEs"
    | "languageCodeEn"
    | "languageCodePtBr"
    | "languageCodeUk"
    | "languageCodeKo";
  nameKey:
    | "languageNameEs"
    | "languageNameEn"
    | "languageNamePtBr"
    | "languageNameUk"
    | "languageNameKo";
}

const localeOptions: LocaleOption[] = [
  {value: "es", codeKey: "languageCodeEs", nameKey: "languageNameEs"},
  {value: "en", codeKey: "languageCodeEn", nameKey: "languageNameEn"},
  {value: "pt-br", codeKey: "languageCodePtBr", nameKey: "languageNamePtBr"},
  {value: "uk", codeKey: "languageCodeUk", nameKey: "languageNameUk"},
  {value: "ko", codeKey: "languageCodeKo", nameKey: "languageNameKo"}
];

function buildLocalePath(pathname: string, nextLocale: AppLocale): string {
  const localizedPath = pathname.replace(
    /^\/(en|es|pt-br|uk|ko)(?=\/|$)/,
    `/${nextLocale}`
  );
  return localizedPath === pathname ? `/${nextLocale}` : localizedPath;
}

function persistLocalePreference(nextLocale: AppLocale): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("standx-hub-locale", nextLocale);
  document.cookie = `standx-hub-locale=${nextLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

export default function Footer({locale}: FooterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tCommon = useTranslations("common");
  const tFooter = useTranslations("footer");
  const tLinks = useTranslations("links");

  const tNavbar = useTranslations("navbar");

  const navLinks = useMemo(() => getHubNavItems(locale), [locale]);
  const currentPath = normalizePath(pathname);
  const homeHref = `/${locale}`;

  const localeOption = localeOptions.find((option) => option.value === locale);
  const currentLocaleName = localeOption
    ? tCommon(localeOption.nameKey)
    : tCommon("languageNameEn");

  const switchLocale = (nextLocale: AppLocale): void => {
    if (nextLocale === locale) {
      return;
    }

    persistLocalePreference(nextLocale);

    const nextPath = buildLocalePath(pathname, nextLocale);
    const query = searchParams.toString();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const route = `${nextPath}${query.length > 0 ? `?${query}` : ""}${hash}`;

    router.replace(route, {scroll: false});
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    switchLocale(event.target.value as AppLocale);
  };

  const isActivePath = (href: string): boolean => normalizePath(href) === currentPath;

  return (
    <footer id="about" className="relative mt-20 pb-10 pt-14">
      <div className="section-shell relative space-y-10">
        <div className="hairline" aria-hidden="true" />

        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_1fr]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5">
              <span className="live-dot" aria-hidden="true" />
              <p className="text-[0.95rem] font-semibold tracking-tight text-text-primary">
                {tCommon("brand")}
              </p>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
              {tFooter("description")}
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
              {tFooter("navigationLabel")}
            </p>

            <nav className="grid gap-0.5">
              <Link
                href={homeHref}
                className={`focus-ring inline-flex min-h-9 items-center rounded-md text-sm transition ${
                  isActivePath(homeHref)
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-accent-cyan"
                }`}
                aria-current={isActivePath(homeHref) ? "page" : undefined}
              >
                {tNavbar("home")}
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={`footer-${link.href}`}
                  href={link.href}
                  className={`focus-ring inline-flex min-h-9 items-center rounded-md text-sm transition ${
                    isActivePath(link.href)
                      ? "text-text-primary"
                      : "text-text-secondary hover:text-accent-cyan"
                  }`}
                  aria-current={isActivePath(link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
              {tFooter("connectLabel")}
            </p>

            <div className="flex flex-wrap gap-2">
              <a
                href={tLinks("discord")}
                target="_blank"
                rel="noreferrer"
                aria-label={tCommon("joinDiscord")}
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl bg-bg-surface/45 px-3 py-2 text-sm text-text-secondary transition hover:text-accent-cyan"
                style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.1)"}}
              >
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                {tFooter("social.discord")}
              </a>

              <a
                href={tLinks("standxOfficial")}
                target="_blank"
                rel="noreferrer"
                aria-label={tCommon("visitStandX")}
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl bg-bg-surface/45 px-3 py-2 text-sm text-text-secondary transition hover:text-accent-cyan"
                style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.1)"}}
              >
                <ChartNoAxesCombined className="h-4 w-4" aria-hidden="true" />
                {tFooter("social.x")}
              </a>

              <a
                href={tLinks("docs")}
                target="_blank"
                rel="noreferrer"
                aria-label={tCommon("openDocs")}
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl bg-bg-surface/45 px-3 py-2 text-sm text-text-secondary transition hover:text-accent-cyan"
                style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.1)"}}
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {tFooter("social.docs")}
              </a>
            </div>

            <label className="grid max-w-[220px] gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {tNavbar("languageLabel")}
              </span>
              <div className="relative">
                <Globe2
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
                <select
                  value={locale}
                  onChange={handleLanguageChange}
                  aria-label={tCommon("languageSwitcherAria", {locale: currentLocaleName})}
                  className="focus-ring min-h-11 w-full appearance-none rounded-xl bg-bg-surface/45 py-2 pl-9 pr-9 text-sm font-semibold text-text-primary"
                  style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.1)"}}
                >
                  {localeOptions.map((option) => (
                    <option key={`footer-${option.value}`} value={option.value}>
                      {tCommon(option.nameKey)}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="hairline mb-4" aria-hidden="true" />
          <p className="text-sm text-text-secondary">{tFooter("attribution")}</p>
          <p className="text-xs text-text-muted">{tFooter("legal")}</p>
        </div>
      </div>
    </footer>
  );
}
