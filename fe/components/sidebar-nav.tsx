"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface SidebarSection {
  label?: string | null;
  items: { href: string; label: string; icon: LucideIcon }[];
}

export function SidebarNav({ sections }: { sections: SidebarSection[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-4" aria-label="Sidebar navigation">
      {sections.map((section, si) => (
        <div key={si}>
          {section.label && (
            <p className="px-3 mb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{section.label}</p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
                    active
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary"
                      : "text-gray-500 dark:text-gray-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                  aria-current={active ? "page" : undefined}>
                  <div className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    active ? "bg-primary text-white shadow-sm" : "bg-transparent"
                  )}>
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
