import type { Metadata } from "next";
import { headers } from "next/headers";
import idMessages from "../messages/id.json";
import enMessages from "../messages/en.json";
import { Providers } from "./providers";
import { BottomNav } from "@/components/bottom-nav";
import { ToastContainer } from "@/components/toast-container";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineIndicator } from "@/components/offline-indicator";
import { InstallPrompt } from "@/components/install-prompt";
import { CookieConsent } from "@/components/cookie-consent";
import { SkipLink } from "@/components/skip-link";
import "./globals.css";

export const dynamic = "force-dynamic";

const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

function getLocale(): "id" | "en" {
  const headersList = headers();
  const locale = headersList.get("x-locale");
  return locale === "en" ? "en" : "id";
}

function getMessages(locale: "id" | "en") {
  return locale === "en" ? enMessages : idMessages;
}

function getMetadata(locale: "id" | "en"): Metadata {
  const m = getMessages(locale).metadata as Record<string, string>;
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.og_title,
      description: m.og_description,
      type: "website",
      siteName: "YourPage",
    },
    twitter: {
      card: "summary_large_image",
      title: m.twitter_title,
      description: m.twitter_description,
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  return getMetadata(locale);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();

  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
        <meta name="theme-color" content="#EC4899" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Rubik:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <Providers>
          <ErrorBoundary>
            <SkipLink />
            <OfflineIndicator />
            <div className="pb-16 sm:pb-0">
              <main id="main">{children}</main>
            </div>
          </ErrorBoundary>
          <ToastContainer />
          <BottomNav />
          <InstallPrompt />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}