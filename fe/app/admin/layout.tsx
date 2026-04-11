"use client";

import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { BarChart3, Users, FileText, Package, CreditCard, Banknote, ShieldCheck, Flag, Settings, Heart, UserCog, TrendingUp, Target } from "lucide-react";

const sections = [
  {
    items: [
      { href: "/admin", label: "Ringkasan", icon: BarChart3 },
    ],
  },
  {
    label: "Pengguna",
    items: [
      { href: "/admin/users", label: "Semua User", icon: Users },
      { href: "/admin/kyc", label: "KYC", icon: ShieldCheck },
      { href: "/admin/promo", label: "Promo Creator", icon: Target },
    ],
  },
  {
    label: "Konten",
    items: [
      { href: "/admin/posts", label: "Post", icon: FileText },
      { href: "/admin/products", label: "Produk", icon: Package },
      { href: "/admin/reports", label: "Laporan", icon: Flag },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/admin/payments", label: "Pembayaran", icon: CreditCard },
      { href: "/admin/topups", label: "Top-up", icon: CreditCard },
      { href: "/admin/donations", label: "Donasi", icon: Heart },
      { href: "/admin/withdrawals", label: "Penarikan", icon: Banknote },
      { href: "/admin/profit", label: "Profit", icon: TrendingUp },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/settings", label: "Pengaturan", icon: Settings },
      { href: "/admin/profile", label: "Profil", icon: UserCog },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <Navbar />
      <div className="mx-auto flex max-w-7xl">
        <MobileSidebar><SidebarNav sections={sections} /></MobileSidebar>
        <div className="flex-1 p-4 md:p-6 min-w-0">{children}</div>
      </div>
    </AuthGuard>
  );
}
