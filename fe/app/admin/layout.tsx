"use client";

import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { useTranslation } from "@/lib/use-translation";
import { BarChart3, Users, FileText, Package, CreditCard, Banknote, ShieldCheck, Flag, Settings, Heart, UserCog, TrendingUp, Target } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  const sections = [
    {
      items: [
        { href: "/admin", label: t("admin_nav.summary"), icon: BarChart3 },
      ],
    },
    {
      label: t("admin_nav.user_management"),
      items: [
        { href: "/admin/users", label: t("admin_nav.users"), icon: Users },
        { href: "/admin/kyc", label: t("admin_nav.kyc"), icon: ShieldCheck },
        { href: "/admin/promo", label: t("admin_nav.promo_creator"), icon: Target },
      ],
    },
    {
      label: t("admin_nav.content"),
      items: [
        { href: "/admin/posts", label: t("admin_nav.posts"), icon: FileText },
        { href: "/admin/products", label: t("admin_nav.products"), icon: Package },
        { href: "/admin/reports", label: t("admin_nav.reports"), icon: Flag },
      ],
    },
    {
      label: t("admin_nav.finance"),
      items: [
        { href: "/admin/payments", label: t("admin_nav.payments"), icon: CreditCard },
        { href: "/admin/topups", label: t("admin_nav.topups"), icon: CreditCard },
        { href: "/admin/donations", label: t("admin_nav.donations"), icon: Heart },
        { href: "/admin/withdrawals", label: t("admin_nav.withdrawals"), icon: Banknote },
        { href: "/admin/profit", label: t("admin_nav.profit"), icon: TrendingUp },
      ],
    },
    {
      label: t("admin_nav.system"),
      items: [
        { href: "/admin/settings", label: t("admin_nav.settings"), icon: Settings },
        { href: "/admin/profile", label: t("admin_profile.profile"), icon: UserCog },
      ],
    },
  ];

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
