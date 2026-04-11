import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem { label: string; href?: string; }

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto", className)}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-none">{item.label}</Link>
          ) : (
            <span className={cn(i === items.length - 1 && "text-gray-900 dark:text-gray-100 font-medium")} aria-current={i === items.length - 1 ? "page" : undefined}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
