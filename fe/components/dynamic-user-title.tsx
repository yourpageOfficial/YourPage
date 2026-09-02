"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const ROUTE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/posts": "Kelola Post",
  "/dashboard/products": "Kelola Produk",
  "/dashboard/sales": "Penjualan",
  "/dashboard/donations": "Donasi",
  "/dashboard/analytics": "Analitik",
  "/dashboard/withdrawals": "Penarikan",
  "/dashboard/profile": "Profil Kreator",
  "/dashboard/subscription": "Langganan",
  "/s": "Dashboard Supporter",
  "/wallet": "Wallet",
  "/chat": "Pesan",
  "/notifications": "Notifikasi",
  "/explore": "Explore Kreator",
  "/feed": "Feed",
};

export function DynamicUserTitle() {
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const defaultTitle = "YourPage — Halaman kamu, penghasilanmu";

    if (!user) {
      document.title = defaultTitle;
      return;
    }

    const userName = user.display_name || user.username || "Kreator";
    const pageName = ROUTE_NAMES[pathname] || (pathname.startsWith("/c/") ? "Halaman Kreator" : "");

    if (pageName) {
      document.title = `${pageName} — ${userName} | YourPage`;
    } else {
      document.title = `${userName} | YourPage`;
    }
  }, [user, pathname]);

  return null;
}
