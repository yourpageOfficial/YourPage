import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useDebounce } from "@/lib/use-debounce";

type SortDir = "asc" | "desc";

export function useAdminList(key: string, endpoint: string, opts?: { filterParam?: string }) {
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [cursors, setCursors] = useState<string[]>([]);
  const page = cursors.length;
  const currentCursor = cursors[cursors.length - 1] || "";
  const filterParam = opts?.filterParam || "status";

  const { data, isLoading } = useQuery({
    queryKey: [key, filter, currentCursor],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (currentCursor) params.set("cursor", currentCursor);
      if (filter) params.set(filterParam, filter);
      const { data } = await api.get(`${endpoint}?${params}`);
      return { items: (data.data || []) as any[], nextCursor: data.next_cursor as string | null };
    },
  });

  const filtered = useMemo(() => {
    let items = data?.items || [];

    // Client-side search across all string fields
    if (search) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter((item: any) =>
        Object.values(item).some((v) => typeof v === "string" && v.toLowerCase().includes(q))
      );
    }

    // Client-side sort
    if (sortKey) {
      items = [...items].sort((a: any, b: any) => {
        const av = a[sortKey], bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }

    return items;
  }, [data?.items, search, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  return {
    items: filtered,
    isLoading,
    filter, setFilter,
    search, setSearch,
    sortKey, sortDir, toggleSort,
    nextCursor: data?.nextCursor,
    hasPrev: page > 0,
    onNext: () => { if (data?.nextCursor) setCursors([...cursors, data.nextCursor]); },
    onPrev: () => setCursors(cursors.slice(0, -1)),
  };
}
