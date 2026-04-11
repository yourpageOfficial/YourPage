"use client";

import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { Rss, FileText, Package, Heart, Wallet, Receipt, Settings } from "lucide-react";

const sections = [
  {
    items: [
      { href: "/s", label: "Feed", icon: Rss },
    ],
  },
  {
    label: "Koleksi",
    items: [
      { href: "/s/posts", label: "Post", icon: FileText },
      { href: "/s/products", label: "Produk", icon: Package },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/s/transactions", label: "Transaksi", icon: Receipt },
      { href: "/s/donations", label: "Donasi Saya", icon: Heart },
      { href: "/s/wallet", label: "Wallet", icon: Wallet },
    ],
  },
  {
    label: "Akun",
    items: [
      { href: "/s/settings", label: "Pengaturan", icon: Settings },
    ],
  },
];

export default function SupporterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Navbar />
      <div className="mx-auto flex max-w-6xl">
        <MobileSidebar><SidebarNav sections={sections} /></MobileSidebar>
        <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </AuthGuard>
  );
}
