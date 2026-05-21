"use client";

import Link from "next/link";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {ChevronDown, Globe2} from "lucide-react";
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
  nativeName: string;
}

const localeOptions: LocaleOption[] = [
  {value: "en", codeKey: "languageCodeEn", nameKey: "languageNameEn", nativeName: "English"},
  {value: "es", codeKey: "languageCodeEs", nameKey: "languageNameEs", nativeName: "Español"},
  {value: "pt-br", codeKey: "languageCodePtBr", nameKey: "languageNamePtBr", nativeName: "Português (BR)"},
  {value: "uk", codeKey: "languageCodeUk", nameKey: "languageNameUk", nativeName: "Українська"},
  {value: "ko", codeKey: "languageCodeKo", nameKey: "languageNameKo", nativeName: "한국어"}
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
    <footer id="about" className="border-t border-border-hairline">
      <div className="section-shell py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5">
              <span className="live-dot" aria-hidden="true" />
              <p className="font-mono text-xs font-semibold uppercase tracking-widepill text-text-primary">
                {tCommon("brand")}
              </p>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
              {tFooter("description")}
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-widercaps text-text-muted">
              {tFooter("navigationLabel")}
            </p>

            <nav className="grid gap-1.5" aria-label={tFooter("navigationLabel")}>
              <FooterLink href={homeHref} label={tNavbar("home")} active={isActivePath(homeHref)} />
              {navLinks.map((link) => (
                <FooterLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={isActivePath(link.href)}
                />
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-widercaps text-text-muted">
              {tFooter("connectLabel")}
            </p>

            <nav className="grid gap-1.5" aria-label={tFooter("connectLabel")}>
              <ExternalFooterLink href={tLinks("discord")} label={tFooter("social.discord")} aria={tCommon("joinDiscord")} />
              <ExternalFooterLink href={tLinks("standxOfficial")} label={tFooter("social.x")} aria={tCommon("visitStandX")} />
              <ExternalFooterLink href={tLinks("docs")} label={tFooter("social.docs")} aria={tCommon("openDocs")} />
            </nav>
          </div>

          <div className="space-y-3">
            <label className="grid gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widercaps text-text-muted">
                {tNavbar("languageLabel")}
              </span>
              <div className="relative">
                <Globe2
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary"
                  aria-hidden="true"
                />
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary"
                  aria-hidden="true"
                />
                <select
                  value={locale}
                  onChange={handleLanguageChange}
                  aria-label={tCommon("languageSwitcherAria", {locale: currentLocaleName})}
                  className="focus-ring min-h-10 w-full appearance-none border border-border-base bg-transparent py-2 pl-9 pr-8 font-mono text-[11px] font-semibold uppercase tracking-widepill text-text-primary"
                >
                  {localeOptions.map((option) => (
                    <option key={`footer-${option.value}`} value={option.value}>
                      {option.nativeName} ({tCommon(option.codeKey)})
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
        </div>

        <div className="hairline mt-14" aria-hidden="true" />

        <div className="mt-6 flex flex-col gap-3 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
          <p className="text-text-secondary">{tFooter("attribution")}</p>
          <p className="text-xs">{tFooter("legal")}</p>
        </div>
      </div>
    </footer>
  );
}

interface FooterLinkProps {
  href: string;
  label: string;
  active: boolean;
}

function FooterLink({href, label, active}: FooterLinkProps) {
  return (
    <Link
      href={href}
      className={`focus-ring inline-flex min-h-8 items-center text-sm transition ${
        active ? "text-accent-lime" : "text-text-secondary hover:text-text-primary"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

interface ExternalFooterLinkProps {
  href: string;
  label: string;
  aria: string;
}

function ExternalFooterLink({href, label, aria}: ExternalFooterLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={aria}
      className="focus-ring inline-flex min-h-8 items-center text-sm text-text-secondary transition hover:text-accent-lime"
    >
      {label}
    </a>
  );
}
