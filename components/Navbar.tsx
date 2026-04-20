"use client";

import Link from "next/link";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {AnimatePresence, motion} from "framer-motion";
import {ArrowUpRight, ChevronDown, Globe2, Menu, X} from "lucide-react";
import {useEffect, type ChangeEvent, type MouseEvent, useState} from "react";
import {useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/request";
import {drawerBackdropVariants, drawerPanelVariants} from "@/lib/motion";

interface NavbarProps {
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
  {value: "en", codeKey: "languageCodeEn", nameKey: "languageNameEn"},
  {value: "es", codeKey: "languageCodeEs", nameKey: "languageNameEs"},
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

export default function Navbar({locale}: NavbarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tCommon = useTranslations("common");
  const tNavbar = useTranslations("navbar");
  const tLinks = useTranslations("links");

  const localeOption = localeOptions.find((option) => option.value === locale);
  const currentLocaleName = localeOption
    ? tCommon(localeOption.nameKey)
    : tCommon("languageNameEn");

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDrawerOpen]);

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
    setIsDrawerOpen(false);
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    switchLocale(event.target.value as AppLocale);
  };

  const closeDrawerOnBackdrop = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      setIsDrawerOpen(false);
    }
  };

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 bg-bg-base/55 backdrop-blur-xl"
        style={{boxShadow: "inset 0 -1px 0 rgba(148, 184, 232, 0.08)"}}
      >
      <div className="section-shell flex min-h-[68px] items-center justify-between gap-3">
        <Link
          href={`/${locale}`}
          className="focus-ring group inline-flex min-h-11 items-center gap-2.5 rounded-xl px-2 py-1 text-sm font-semibold tracking-tight text-text-primary"
        >
          <span className="live-dot" aria-hidden="true" />
          <span className="truncate sm:hidden">{tCommon("brandShort")}</span>
          <span className="hidden text-[0.95rem] sm:inline">{tCommon("brand")}</span>
        </Link>

        {/* Right cluster: language + primary CTA. Section nav is NOT repeated here on purpose;
            full directory lives on the homepage and the secondary tab bar on each section page. */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Globe2
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.55)]"
              aria-hidden="true"
            />
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
              aria-hidden="true"
            />
            <select
              value={locale}
              onChange={handleLanguageChange}
              aria-label={tCommon("languageSwitcherAria", {locale: currentLocaleName})}
              className="focus-ring min-h-11 appearance-none rounded-xl bg-bg-surface/55 py-2 pl-9 pr-9 text-sm font-semibold text-text-primary transition hover:bg-bg-surface/80"
              style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.1)"}}
            >
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {tCommon(option.codeKey)}
                </option>
              ))}
            </select>
          </div>

          <a
            href={tLinks("startTrading")}
            target="_blank"
            rel="noreferrer"
            aria-label={tCommon("startTradingAria")}
            className="cta-primary focus-ring hidden min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-glow sm:inline-flex"
          >
            {tNavbar("primaryCta")}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label={tCommon("openNavigation")}
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-bg-surface/55 text-text-primary transition hover:text-accent-cyan sm:hidden"
            style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.1)"}}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      </header>

      <AnimatePresence>
        {isDrawerOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] bg-bg-base/65 backdrop-blur-sm sm:hidden"
            variants={drawerBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeDrawerOnBackdrop}
          >
            <motion.aside
              variants={drawerPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ml-auto flex h-full w-[min(88vw,20rem)] flex-col bg-bg-elevated p-5"
              style={{boxShadow: "inset 1px 0 0 rgba(148, 184, 232, 0.1)"}}
              aria-modal="true"
              role="dialog"
              aria-label={tNavbar("drawerTitle")}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="live-dot" aria-hidden="true" />
                  <p className="text-sm font-semibold tracking-tight text-text-primary">
                    {tCommon("brandShort")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label={tCommon("closeNavigation")}
                  className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-text-secondary transition hover:text-text-primary"
                  style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.12)"}}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <label className="mb-5 grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  {tNavbar("languageLabel")}
                </span>
                <div className="relative">
                  <Globe2
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.55)]"
                    aria-hidden="true"
                  />
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                    aria-hidden="true"
                  />
                  <select
                    value={locale}
                    onChange={handleLanguageChange}
                    aria-label={tCommon("languageSwitcherAria", {locale: currentLocaleName})}
                    className="focus-ring min-h-11 w-full appearance-none rounded-xl bg-bg-base/60 py-2 pl-9 pr-9 text-sm font-semibold text-text-primary"
                    style={{boxShadow: "inset 0 0 0 1px rgba(148, 184, 232, 0.1)"}}
                  >
                    {localeOptions.map((option) => (
                      <option key={`drawer-${option.value}`} value={option.value}>
                         {tCommon(option.nameKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <a
                href={tLinks("startTrading")}
                target="_blank"
                rel="noreferrer"
                aria-label={tCommon("startTradingAria")}
                className="cta-primary focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-glow"
              >
                {tNavbar("primaryCta")}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>

              <div className="my-6 hairline" aria-hidden="true" />

              <p className="text-xs leading-relaxed text-text-muted">
                {tNavbar("drawerDescription")}
              </p>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
