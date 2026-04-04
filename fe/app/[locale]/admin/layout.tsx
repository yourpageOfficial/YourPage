"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { cn } from "@/lib/utils";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { BarChart3, Users, FileText, Package, CreditCard, Banknote, ShieldCheck, Flag, Settings, Heart, UserCog, TrendingUp, Target } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("Admin");

  const items = [
    { href: "/admin", label: t("summary"), icon: BarChart3 },
    { href: "/admin/users", label: t("users"), icon: Users },
    { href: "/admin/promo", label: t("promo_creator"), icon: Target },
    { href: "/admin/posts", label: t("content"), icon: FileText },
    { href: "/admin/products", label: t("products_label"), icon: Package },
    { href: "/admin/payments", label: t("payments"), icon: CreditCard },
    { href: "/admin/topups", label: t("topup_title"), icon: CreditCard },
    { href: "/admin/donations", label: t("donations_title"), icon: Heart },
    { href: "/admin/withdrawals", label: t("withdrawals_title"), icon: Banknote },
    { href: "/admin/kyc", label: t("kyc_title"), icon: ShieldCheck },
    { href: "/admin/reports", label: t("reports"), icon: Flag },
    { href: "/admin/profit", label: t("profit"), icon: TrendingUp },
    { href: "/admin/settings", label: t("settings"), icon: Settings },
    { href: "/admin/profile", label: t("admin_profile"), icon: UserCog },
  ];

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
