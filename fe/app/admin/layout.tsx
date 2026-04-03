"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { cn } from "@/lib/utils";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { BarChart3, Users, FileText, Package, CreditCard, Banknote, ShieldCheck, Flag, Settings, Heart, UserCog, TrendingUp, Target } from "lucide-react";

const items = [
  { href: "/admin", label: "Ringkasan", icon: BarChart3 },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/promo", label: "Promo Creator", icon: Target },
  { href: "/admin/posts", label: "Konten", icon: FileText },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/payments", label: "Pembayaran", icon: CreditCard },
  { href: "/admin/topups", label: "Top-up", icon: CreditCard },
  { href: "/admin/donations", label: "Donasi", icon: Heart },
  { href: "/admin/withdrawals", label: "Penarikan", icon: Banknote },
  { href: "/admin/kyc", label: "KYC", icon: ShieldCheck },
  { href: "/admin/reports", label: "Laporan", icon: Flag },
  { href: "/admin/profit", label: "Profit", icon: TrendingUp },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
  { href: "/admin/profile", label: "Profil", icon: UserCog },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard role="admin">
      <Navbar />
      <div className="mx-auto flex max-w-7xl">
        <MobileSidebar>
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Admin</p>
          <nav className="space-y-0.5">
            {items.map((i) => (
              <Link key={i.href} href={i.href}
                className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  pathname === i.href ? "bg-primary-50 dark:bg-primary-900/20 text-primary font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}>
                <i.icon className="h-4 w-4" />{i.label}
              </Link>
            ))}
          </nav>
        </MobileSidebar>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
