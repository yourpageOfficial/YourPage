"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Home, Bell, User, Rss } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const dashboardLink = user.role === "admin" ? "/admin" : user.role === "creator" ? "/dashboard" : "/s";

  const items = [
    { href: dashboardLink, icon: Home, label: "Home" },
    { href: user.role === "creator" ? "/dashboard/feed" : "/feed", icon: Rss, label: "Feed" },
    { href: "/notifications", icon: Bell, label: "Notif" },
    { href: user.role === "admin" ? "/admin/profile" : "/profile", icon: User, label: "Profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-700 safe-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-full h-full text-[10px] transition-colors",
              active ? "text-primary" : "text-gray-400 dark:text-gray-500"
            )}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
