"use client";

import {Check, Globe} from "lucide-react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef, useState, type KeyboardEvent} from "react";
import {useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/request";

interface LanguageSwitcherProps {
  locale: AppLocale;
  /** Visual variant. "navbar" uses a borderless icon trigger (right-aligned
   *  popover). "panel" uses a bordered trigger that suits the mobile drawer
   *  or footer. */
  variant?: "navbar" | "panel";
  /** Where the popover should anchor horizontally relative to the trigger. */
  align?: "left" | "right";
}

interface LocaleOption {
  value: AppLocale;
  codeKey:
    | "languageCodeEn"
    | "languageCodeEs"
    | "languageCodePtBr"
    | "languageCodeUk"
    | "languageCodeKo";
  nameKey:
    | "languageNameEn"
    | "languageNameEs"
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

export default function LanguageSwitcher({
  locale,
  variant = "navbar",
  align = "right"
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tCommon = useTranslations("common");
  const tNavbar = useTranslations("navbar");

  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    Math.max(
      0,
      localeOptions.findIndex((option) => option.value === locale)
    )
  );

  const currentOption =
    localeOptions.find((option) => option.value === locale) ?? localeOptions[0];
  const currentName = tCommon(currentOption.nameKey);

  // Click outside / Esc closes. Mounted only while open to keep listeners lean.
  useEffect(() => {
    if (!open) return;

    const onClick = (event: globalThis.MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // When opening, move focus to the currently-selected option for keyboard nav.
  useEffect(() => {
    if (!open) return;
    const idx = Math.max(
      0,
      localeOptions.findIndex((option) => option.value === locale)
    );
    setActiveIndex(idx);
    queueMicrotask(() => optionRefs.current[idx]?.focus());
  }, [open, locale]);

  const switchLocale = (nextLocale: AppLocale): void => {
    setOpen(false);
    if (nextLocale === locale) return;

    persistLocalePreference(nextLocale);

    const nextPath = buildLocalePath(pathname, nextLocale);
    const query = searchParams.toString();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const route = `${nextPath}${query.length > 0 ? `?${query}` : ""}${hash}`;

    router.replace(route, {scroll: false});
  };

  const handleListKey = (event: KeyboardEvent<HTMLUListElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = (activeIndex + 1) % localeOptions.length;
      setActiveIndex(next);
      optionRefs.current[next]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = (activeIndex - 1 + localeOptions.length) % localeOptions.length;
      setActiveIndex(next);
      optionRefs.current[next]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      optionRefs.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      const last = localeOptions.length - 1;
      setActiveIndex(last);
      optionRefs.current[last]?.focus();
    }
  };

  const triggerClass =
    variant === "navbar"
      ? "focus-ring inline-flex min-h-10 min-w-10 items-center justify-center text-text-secondary transition hover:text-accent-lime"
      : "focus-ring inline-flex min-h-10 w-full items-center justify-between gap-2 border border-border-base px-3 font-mono text-[11px] font-semibold uppercase tracking-widepill text-text-primary transition hover:border-accent-lime hover:text-accent-lime";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={tCommon("languageSwitcherAria", {locale: currentName})}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={triggerClass}
        title={tNavbar("languageLabel")}
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        {variant === "panel" ? (
          <>
            <span className="flex-1 text-left">
              {currentOption.nativeName}
            </span>
            <span className="text-text-muted">{tCommon(currentOption.codeKey)}</span>
          </>
        ) : null}
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={tNavbar("languageLabel")}
          onKeyDown={handleListKey}
          className={`absolute z-50 mt-2 min-w-[14rem] border border-border-base bg-bg-elevated shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <li className="border-b border-border-hairline px-3 py-2 font-mono text-[10px] uppercase tracking-widercaps text-text-muted">
            {tNavbar("languageLabel")}
          </li>
          {localeOptions.map((option, index) => {
            const selected = option.value === locale;
            return (
              <li key={option.value} role="none">
                <button
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={activeIndex === index ? 0 : -1}
                  onClick={() => switchLocale(option.value)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`focus-ring flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "text-accent-lime"
                      : "text-text-primary hover:bg-bg-surface"
                  }`}
                >
                  <span className="flex-1 font-medium">{option.nativeName}</span>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-widepill text-text-muted">
                    {tCommon(option.codeKey)}
                  </span>
                  {selected ? (
                    <Check className="h-3.5 w-3.5 text-accent-lime" aria-hidden="true" />
                  ) : (
                    <span className="w-3.5" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
