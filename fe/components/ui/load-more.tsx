"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LoadMore({ hasMore, loading, onLoad }: { hasMore: boolean; loading: boolean; onLoad: () => void }) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center py-4">
      <Button variant="outline" size="sm" onClick={onLoad} disabled={loading}>
        {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Memuat...</> : "Muat Lebih Banyak"}
      </Button>
    </div>
  );
}
