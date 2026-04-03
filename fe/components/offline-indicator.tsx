"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setOffline(!navigator.onLine);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-[90] bg-red-600 text-white text-center py-1.5 text-xs font-medium flex items-center justify-center gap-1">
      <WifiOff className="h-3 w-3" /> Tidak ada koneksi internet
    </div>
  );
}
