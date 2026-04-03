import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BottomNav } from "@/components/bottom-nav";
import { ToastContainer } from "@/components/toast-container";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineIndicator } from "@/components/offline-indicator";

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
        <meta name="theme-color" content="#2563EB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('theme');
            if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch {}
        `}} />
      </head>
      <body>
        <Providers>
          <ErrorBoundary>
            <OfflineIndicator />
            <div className="pb-14 sm:pb-0">{children}</div>
          </ErrorBoundary>
          <ToastContainer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
