"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { cn } from "@/lib/utils";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { BarChart3, FileText, Package, Heart, Banknote, ShieldCheck, UserCog, Receipt, Rss, Sparkles, PieChart } from "lucide-react";

const sidebarItems = [
  { href: "/dashboard", label: "Ringkasan", icon: BarChart3 },
  { href: "/dashboard/feed", label: "Feed", icon: Rss },
  { href: "/dashboard/posts", label: "Konten", icon: FileText },
  { href: "/dashboard/products", label: "Produk", icon: Package },
  { href: "/dashboard/sales", label: "Penjualan", icon: Receipt },
  { href: "/dashboard/donations", label: "Donasi", icon: Heart },
  { href: "/dashboard/analytics", label: "Analitik", icon: PieChart },
  { href: "/dashboard/withdrawals", label: "Penarikan", icon: Banknote },
  { href: "/dashboard/subscription", label: "Langganan", icon: Sparkles },
  { href: "/dashboard/profile", label: "Profil", icon: UserCog },
  { href: "/dashboard/kyc", label: "Verifikasi KYC", icon: ShieldCheck },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard role="creator">
      <Navbar />
      <div className="mx-auto flex max-w-6xl">
        <MobileSidebar>
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href ? "bg-primary-50 dark:bg-primary-900/20 text-primary" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}>
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            ))}
          </nav>
        </MobileSidebar>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
