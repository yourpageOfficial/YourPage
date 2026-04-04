"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { cn } from "@/lib/utils";
import { FileText, Package, Heart, Wallet } from "lucide-react";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("LibraryNav");
  const pathname = usePathname();

  const items = [
    { href: "/library/posts", label: t("posts"), icon: FileText },
    { href: "/library/products", label: t("products"), icon: Package },
    { href: "/donations/sent", label: t("donations_sent"), icon: Heart },
    { href: "/wallet", label: t("wallet"), icon: Wallet },
  ];

  return (
    <AuthGuard>
      <Navbar />
      <div className="mx-auto flex max-w-6xl">
        <MobileSidebar>
          <nav className="space-y-1">
            {items.map((item) => (
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
