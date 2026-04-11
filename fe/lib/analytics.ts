declare global {
  interface Window { gtag?: (...args: any[]) => void; plausible?: (event: string, opts?: { props?: Record<string, any> }) => void; }
}

export function trackEvent(name: string, props?: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, props);
  window.plausible?.(name, { props });
}
