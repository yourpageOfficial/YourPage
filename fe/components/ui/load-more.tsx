"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/use-translation";

/**
 * @deprecated Use InfiniteScroll component instead: `@/components/ui/infinite-scroll`
 */
export function LoadMore({ hasMore, loading, onLoad }: { hasMore: boolean; loading: boolean; onLoad: () => void }) {
  const { t } = useTranslation();

  if (!hasMore) return null;
  return (
    <div className="flex justify-center py-4">
      <Button variant="outline" size="sm" onClick={onLoad} disabled={loading}>
        {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> {t("common.loading_more")}</> : t("common.load_more")}
      </Button>
    </div>
  );
}
