import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BottomNav } from "@/components/bottom-nav";
import { ToastContainer } from "@/components/toast-container";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineIndicator } from "@/components/offline-indicator";
import { InstallPrompt } from "@/components/install-prompt";
import { CookieConsent } from "@/components/cookie-consent";

// Skip static prerendering — all pages are client-side
export const dynamic = "force-dynamic";

// Hardcoded theme detection script — no user input, safe usage of dangerouslySetInnerHTML
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export const metadata: Metadata = {
  title: "YourPage — Halaman kamu, penghasilanmu",
  description: "Platform monetisasi konten untuk kreator Indonesia. Jual konten, produk digital, dan terima donasi.",
  openGraph: {
    title: "YourPage — Halaman kamu, penghasilanmu",
    description: "Platform monetisasi konten untuk kreator Indonesia.",
    type: "website",
    siteName: "YourPage",
  },
  twitter: {
    card: "summary_large_image",
    title: "YourPage",
    description: "Platform monetisasi konten untuk kreator Indonesia.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
        <meta name="theme-color" content="#EC4899" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Rubik:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {/* Theme script — hardcoded, no user input, prevents FOUC */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <Providers>
          <ErrorBoundary>
            <a href="#main" className="skip-to-main" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>Skip to main content</a>
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
