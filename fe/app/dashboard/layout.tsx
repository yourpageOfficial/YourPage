"use client";

import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { BarChart3, FileText, Package, Heart, Banknote, ShieldCheck, UserCog, Receipt, Rss, Sparkles, PieChart, MessageCircle, Target, Monitor, Users2 } from "lucide-react";

const sections = [
  {
    items: [
      { href: "/dashboard", label: "Ringkasan", icon: BarChart3 },
      { href: "/dashboard/feed", label: "Feed", icon: Rss },
    ],
  },
  {
    label: "Konten",
    items: [
      { href: "/dashboard/posts", label: "Post", icon: FileText },
      { href: "/dashboard/products", label: "Produk", icon: Package },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/dashboard/sales", label: "Penjualan", icon: Receipt },
      { href: "/dashboard/donations", label: "Donasi", icon: Heart },
      { href: "/dashboard/analytics", label: "Analitik", icon: PieChart },
      { href: "/dashboard/withdrawals", label: "Penarikan", icon: Banknote },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { href: "/dashboard/donation-settings", label: "Target & Pesan", icon: Target },
      { href: "/dashboard/subscription", label: "Langganan", icon: Sparkles },
      { href: "/dashboard/membership", label: "Membership", icon: Users2 },
      { href: "/dashboard/chat-settings", label: "Chat", icon: MessageCircle },
      { href: "/dashboard/overlay", label: "Overlay", icon: Monitor },
    ],
  },
  {
    label: "Akun",
    items: [
      { href: "/dashboard/profile", label: "Profil", icon: UserCog },
      { href: "/dashboard/kyc", label: "KYC", icon: ShieldCheck },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="creator">
      <Navbar />
      <div className="mx-auto flex max-w-6xl">
        <MobileSidebar><SidebarNav sections={sections} /></MobileSidebar>
        <div className="flex-1 p-4 md:p-6 min-w-0">{children}</div>
      </div>
    </AuthGuard>
  );
}
