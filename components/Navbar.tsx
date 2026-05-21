"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {AnimatePresence, motion} from "framer-motion";
import {Menu, X} from "lucide-react";
import {useEffect, type MouseEvent, useState} from "react";
import {useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/request";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {getHubNavItems} from "@/lib/hub-navigation";
import {drawerBackdropVariants, drawerPanelVariants} from "@/lib/motion";

interface NavbarProps {
  locale: AppLocale;
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export default function Navbar({locale}: NavbarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const tCommon = useTranslations("common");
  const tNavbar = useTranslations("navbar");
  const tLinks = useTranslations("links");

  const hubItems = getHubNavItems(locale);
  const currentPath = normalizePath(pathname);
  const homeHref = `/${locale}`;
  const isHome = currentPath === homeHref;

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Cmd+K / Ctrl+K opens/closes the menu. Standard command-menu UX, no
  // visible kbd hint so the chrome stays clean — power users discover it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const closeDrawerOnBackdrop = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      setIsDrawerOpen(false);
    }
  };

  const isActiveHref = (href: string): boolean => normalizePath(href) === currentPath;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border-hairline bg-bg-base/95 backdrop-blur-sm">
        <div className="section-shell flex min-h-[60px] items-center gap-3 md:min-h-[64px]">
          <Link
            href={homeHref}
            className="focus-ring group inline-flex min-h-10 items-center gap-2.5 px-1 font-mono text-xs font-semibold uppercase tracking-widepill text-text-primary"
          >
            <span className="live-dot" aria-hidden="true" />
            <span className="truncate sm:hidden">{tCommon("brandShort")}</span>
            <span className="hidden sm:inline">{tCommon("brand")}</span>
          </Link>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <LanguageSwitcher locale={locale} variant="navbar" align="right" />

            <span className="hidden h-5 w-px bg-border-hairline md:block" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label={tCommon("openNavigation")}
              aria-expanded={isDrawerOpen}
              aria-haspopup="dialog"
              className="focus-ring inline-flex min-h-10 items-center gap-2 border border-border-base px-3 text-text-primary transition hover:border-accent-lime hover:text-accent-lime"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widepill">
                {tNavbar("menuLabel")}
              </span>
            </button>

            <a
              href={tLinks("startTrading")}
              target="_blank"
              rel="noreferrer"
              aria-label={tCommon("startTradingAria")}
              className="btn btn-primary hidden sm:inline-flex"
            >
              {tNavbar("primaryCta")}
            </a>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isDrawerOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] bg-bg-base/80 backdrop-blur-sm"
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
              className="ml-auto flex h-full w-full max-w-[28rem] flex-col overflow-y-auto border-l border-border-hairline bg-bg-elevated"
              aria-modal="true"
              role="dialog"
              aria-label={tNavbar("drawerTitle")}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border-hairline px-6 py-5">
                <div className="flex items-center gap-2.5">
                  <span className="live-dot" aria-hidden="true" />
                  <p className="font-mono text-xs font-semibold uppercase tracking-widepill text-text-primary">
                    {tNavbar("drawerTitle")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <kbd className="hidden border border-border-hairline px-1.5 py-1 font-mono text-[10px] text-text-muted md:inline">
                    ESC
                  </kbd>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label={tCommon("closeNavigation")}
                    className="focus-ring inline-flex min-h-9 min-w-9 items-center justify-center border border-border-base text-text-secondary transition hover:border-accent-lime hover:text-accent-lime"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto" aria-label={tNavbar("drawerTitle")}>
                <DrawerNavItem
                  index="01"
                  href={homeHref}
                  label={tNavbar("home")}
                  active={isHome}
                />
                {hubItems.map((item, index) => (
                  <DrawerNavItem
                    key={item.href}
                    index={String(index + 2).padStart(2, "0")}
                    href={item.href}
                    label={item.label}
                    active={isActiveHref(item.href)}
                  />
                ))}
              </nav>

              <div className="space-y-4 border-t border-border-hairline px-6 py-5">
                <LanguageSwitcher locale={locale} variant="panel" align="left" />

                <a
                  href={tLinks("startTrading")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={tCommon("startTradingAria")}
                  className="btn btn-primary w-full"
                >
                  {tNavbar("primaryCta")}
                </a>

                <p className="text-xs leading-relaxed text-text-muted">
                  {tNavbar("drawerDescription")}
                </p>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

interface DrawerNavItemProps {
  index: string;
  href: string;
  label: string;
  active: boolean;
}

function DrawerNavItem({index, href, label, active}: DrawerNavItemProps) {
  return (
    <Link
      href={href}
      className={`focus-ring group flex items-center gap-4 border-b border-border-hairline px-6 py-4 transition-colors hover:bg-bg-surface ${
        active ? "bg-bg-surface" : ""
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className="font-mono text-[11px] uppercase tracking-widercaps text-text-muted">
        {index}
      </span>
      <span
        className={`flex-1 font-mono text-sm font-semibold uppercase tracking-widepill transition-colors group-hover:text-accent-lime ${
          active ? "text-accent-lime" : "text-text-primary"
        }`}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`font-mono text-[11px] tracking-widercaps transition-colors group-hover:text-accent-lime ${
          active ? "text-accent-lime" : "text-text-muted"
        }`}
      >
        →
      </span>
    </Link>
  );
}
