import type {Metadata} from "next";
import {GeistMono} from "geist/font/mono";
import {GeistSans} from "geist/font/sans";
import {cookies} from "next/headers";
import {defaultLocale, isAppLocale} from "@/i18n/request";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://standx-community-hub.vercel.app"),
  title: "StandX Community Hub",
  description:
    "Multilingual community hub for StandX Perpetuals DEX onboarding, DUSD education, and community growth."
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({children}: RootLayoutProps) {
  const localeCookie = cookies().get("standx-hub-locale")?.value;
  const htmlLocale = localeCookie && isAppLocale(localeCookie) ? localeCookie : defaultLocale;

  return (
    <html lang={htmlLocale} suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>{children}</body>
    </html>
  );
}
