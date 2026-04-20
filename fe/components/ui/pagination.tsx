"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/use-translation";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, total, className }: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      {total !== undefined && <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{total} item</span>}
      <div className="flex items-center gap-1 ml-auto">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label={t("common.previous_page")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) => p === "..." ? (
            <span key={`e${i}`} className="px-1 text-gray-400">…</span>
          ) : (
            <Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => onPageChange(p)} aria-label={`Page ${p}`} aria-current={p === page ? "page" : undefined}>
              {p}
            </Button>
          ))}
        </div>
        <span className="sm:hidden text-xs text-gray-500 dark:text-gray-400 px-2">{page}/{totalPages}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label={t("common.next_page")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
