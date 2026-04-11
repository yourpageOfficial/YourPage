"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  children: React.ReactNode;
}

export function InfiniteScroll({ hasMore, loading, onLoadMore, threshold = 0.1, children }: InfiniteScrollProps) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading || !sentinel.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) onLoadMore(); }, { threshold });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [hasMore, loading, onLoadMore, threshold]);

  return (
    <div>
      {children}
      <div ref={sentinel} className="py-4 flex justify-center">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
        {!hasMore && !loading && <p className="text-xs text-gray-400 dark:text-gray-500">Tidak ada lagi</p>}
      </div>
    </div>
  );
}
