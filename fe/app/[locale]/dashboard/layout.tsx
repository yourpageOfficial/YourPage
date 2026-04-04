"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { cn } from "@/lib/utils";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { BarChart3, FileText, Package, Heart, Banknote, ShieldCheck, UserCog, Receipt, Rss, Sparkles, PieChart, MessageCircle } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("DashboardLayout");
  const pathname = usePathname();

  const sidebarItems = [
    { href: "/dashboard", label: t("summary"), icon: BarChart3 },
    { href: "/dashboard/feed", label: t("feed"), icon: Rss },
    { href: "/dashboard/posts", label: t("content"), icon: FileText },
    { href: "/dashboard/products", label: t("products"), icon: Package },
    { href: "/dashboard/sales", label: t("sales"), icon: Receipt },
    { href: "/dashboard/donations", label: t("donations"), icon: Heart },
    { href: "/dashboard/analytics", label: t("analytics"), icon: PieChart },
    { href: "/dashboard/withdrawals", label: t("withdrawal"), icon: Banknote },
    { href: "/dashboard/subscription", label: t("subscription"), icon: Sparkles },
    { href: "/dashboard/chat-settings", label: t("chat"), icon: MessageCircle },
    { href: "/dashboard/profile", label: t("profile"), icon: UserCog },
    { href: "/dashboard/kyc", label: t("kyc"), icon: ShieldCheck },
  ];

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
