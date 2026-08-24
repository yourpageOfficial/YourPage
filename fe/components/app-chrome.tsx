"use client";

import { usePathname } from "next/navigation";
import { OfflineIndicator } from "@/components/offline-indicator";
import { InstallPrompt } from "@/components/install-prompt";
import { CookieConsent } from "@/components/cookie-consent";
import { BottomNav } from "@/components/bottom-nav";

/**
 * Overlay routes are embedded as OBS browser sources and composited onto a
 * live stream, so none of the app chrome may render there — a cookie banner or
 * bottom nav would appear on the broadcast.
 */
export function isOverlayRoute(pathname: string | null) {
  return !!pathname && pathname.startsWith("/overlay");
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isOverlayRoute(pathname)) {
    return <>{children}</>;
  }
  return (
    <>
      <OfflineIndicator />
      <div className="pb-16 sm:pb-0">{children}</div>
      <BottomNav />
      <InstallPrompt />
      <CookieConsent />
    </>
  );
}
