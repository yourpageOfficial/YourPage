"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Home, Bell, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const dashboardLink = user.role === "admin" ? "/admin" : user.role === "creator" ? "/dashboard" : "/s";

  const items = [
    { href: dashboardLink, icon: Home, label: "Beranda" },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
    { href: "/notifications", icon: Bell, label: "Notifikasi" },
    { href: user.role === "admin" ? "/admin/profile" : "/profile", icon: User, label: "Profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/90 dark:bg-navy-900/90 backdrop-blur-xl border-t border-primary-100/80 dark:border-primary-900/30 safe-bottom" role="navigation" aria-label="Main navigation">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium transition-all",
              active ? "text-primary" : "text-gray-400 dark:text-gray-500"
            )} aria-current={active ? "page" : undefined} aria-label={item.label}>
              <div className={cn(
                "flex items-center justify-center w-10 h-7 rounded-full transition-all",
                active && "bg-primary-100 dark:bg-primary-900/30"
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
