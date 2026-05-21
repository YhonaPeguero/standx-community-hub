"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useMemo} from "react";
import {useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/request";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {getHubNavItems} from "@/lib/hub-navigation";

interface FooterProps {
  locale: AppLocale;
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export default function Footer({locale}: FooterProps) {
  const pathname = usePathname();

  const tCommon = useTranslations("common");
  const tFooter = useTranslations("footer");
  const tLinks = useTranslations("links");
  const tNavbar = useTranslations("navbar");

  const navLinks = useMemo(() => getHubNavItems(locale), [locale]);
  const currentPath = normalizePath(pathname);
  const homeHref = `/${locale}`;

  const isActivePath = (href: string): boolean => normalizePath(href) === currentPath;

  return (
    <footer id="about" className="border-t border-border-hairline">
      <div className="section-shell py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Link
              href={homeHref}
              aria-label={tCommon("brand")}
              className="focus-ring group inline-flex items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-widepill text-text-primary"
            >
              <span
                aria-hidden="true"
                className="brand-logo h-6 w-6 text-accent-lime transition-transform duration-300 group-hover:scale-105"
              />
              <span>StandX</span>
              <span className="border border-accent-lime/40 px-1.5 py-0.5 text-[10px] tracking-widercaps text-accent-lime">
                Community
              </span>
            </Link>
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
            <p className="font-mono text-[10px] uppercase tracking-widercaps text-text-muted">
              {tNavbar("languageLabel")}
            </p>
            <LanguageSwitcher
              locale={locale}
              variant="panel"
              align="left"
              placement="top"
            />
          </div>
        </div>

        <div className="hairline mt-14" aria-hidden="true" />

        <div className="mt-6 flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-text-secondary">
            {tFooter.rich("attribution", {
              link: (chunks) => (
                <a
                  href="https://x.com/thisnotmeeme"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="@Thisnotmeeme on X"
                  className="focus-ring font-medium text-text-primary underline decoration-text-muted/50 underline-offset-4 transition hover:text-accent-lime hover:decoration-accent-lime"
                >
                  {chunks}
                </a>
              )
            })}
          </p>
          <p className="text-xs text-text-muted">{tFooter("legal")}</p>
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
      className={`focus-ring inline-flex min-h-11 items-center text-sm transition ${
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
      className="focus-ring inline-flex min-h-11 items-center text-sm text-text-secondary transition hover:text-accent-lime"
    >
      {label}
    </a>
  );
}
