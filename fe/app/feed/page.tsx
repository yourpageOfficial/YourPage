"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { PostCard } from "@/components/post-card";
import { PostSkeleton } from "@/components/ui/skeleton";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { PageTransition } from "@/components/ui/page-transition";
import { Rss } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Post } from "@/lib/types";

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data } = await api.get("/feed?limit=10");
      setPosts(data.data || []);
      setCursor(data.next_cursor || null);
      setHasMore(!!data.next_cursor);
      return data.data;
    },
  });

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get(`/feed?limit=10&cursor=${cursor}`);
      setPosts(prev => [...prev, ...(data.data || [])]);
      setCursor(data.next_cursor || null);
      setHasMore(!!data.next_cursor);
    } finally { setLoadingMore(false); }
  }, [cursor, loadingMore]);

  return (
    <AuthGuard>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-2xl px-3 sm:px-4 py-6 sm:py-8">
          <h1 className="mb-6 text-2xl font-display font-black tracking-tight">Feed</h1>
          {isLoading && <div className="space-y-4">{[1,2,3].map(i => <PostSkeleton key={i} />)}</div>}
          {!isLoading && posts.length === 0 && (
            <div className="text-center py-12">
              <Rss className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Feed kosong</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Follow kreator untuk lihat post mereka di sini</p>
              <Link href="/explore"><Button variant="outline" size="sm" className="mt-4">Temukan Kreator</Button></Link>
            </div>
          )}
          <InfiniteScroll hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore}>
            <div className="space-y-6">
              {posts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          </InfiniteScroll>
        </main>
      </PageTransition>
      <ScrollToTop />
    </AuthGuard>
  );
}
