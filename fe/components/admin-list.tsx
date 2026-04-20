"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useTranslation } from "@/lib/use-translation";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";

interface FilterOption { label: string; value: string }
interface SortOption { label: string; key: string }

interface AdminListProps {
  filters?: FilterOption[];
  activeFilter?: string;
  onFilter?: (v: string) => void;
  search?: string;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  sortOptions?: SortOption[];
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  nextCursor?: string | null;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  count?: number;
  children: React.ReactNode;
}

export function AdminList({ filters, activeFilter, onFilter, search, onSearch, searchPlaceholder, sortOptions, sortKey, sortDir, onSort, nextCursor, onNext, onPrev, hasPrev, count, children }: AdminListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        {onSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder={searchPlaceholder || t("admin_list.search")} value={search || ""} onChange={(e) => onSearch(e.target.value)} className="pl-9" />
          </div>
        )}
        {filters && onFilter && (
          <div className="flex gap-1 flex-wrap">
            <Button size="sm" variant={!activeFilter ? "default" : "outline"} onClick={() => onFilter("")}>All</Button>
            {filters.map((f) => (
              <Button key={f.value} size="sm" variant={activeFilter === f.value ? "default" : "outline"} onClick={() => onFilter(f.value)}>{f.label}</Button>
            ))}
          </div>
        )}
      </div>

      {sortOptions && onSort && (
        <div className="flex gap-1 flex-wrap items-center overflow-x-auto">
          <span className="text-xs text-gray-500 shrink-0">Sort:</span>
          {sortOptions.map((s) => (
            <Button key={s.key} size="sm" variant={sortKey === s.key ? "default" : "ghost"} className="h-7 text-xs shrink-0" onClick={() => onSort(s.key)}>
              {s.label}
              {sortKey === s.key ? (sortDir === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />) : <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />}
            </Button>
          ))}
        </div>
      )}

      {count !== undefined && <p className="text-xs text-gray-400">{count} item</p>}

      {children}

      {(hasPrev || nextCursor) && (
        <div className="flex justify-between pt-2">
          <Button size="sm" variant="outline" disabled={!hasPrev} onClick={onPrev}><ChevronLeft className="h-4 w-4 mr-1" /> Prev</Button>
          <Button size="sm" variant="outline" disabled={!nextCursor} onClick={onNext}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      )}
    </div>
  );
}
