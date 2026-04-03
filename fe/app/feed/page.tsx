"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { PostCard } from "@/components/post-card";
import { PostSkeleton } from "@/components/ui/skeleton";
import { LoadMore } from "@/components/ui/load-more";
import type { Post } from "@/lib/types";

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

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

  const [loadingMore, setLoadingMore] = useState(false);
  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const { data } = await api.get(`/feed?limit=10&cursor=${cursor}`);
    setPosts(prev => [...prev, ...(data.data || [])]);
    setCursor(data.next_cursor || null);
    setHasMore(!!data.next_cursor);
    setLoadingMore(false);
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-2xl px-3 sm:px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-xl sm:text-2xl font-bold">Feed</h1>
        {isLoading && <div className="space-y-4">{[1,2,3].map(i => <PostSkeleton key={i} />)}</div>}
        {!isLoading && posts.length === 0 && <p className="text-gray-500 dark:text-gray-400">Belum ada post. Follow kreator untuk melihat konten mereka.</p>}
        <div className="space-y-6">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
        <LoadMore hasMore={hasMore} loading={loadingMore} onLoad={loadMore} />
      </main>
    </AuthGuard>
  );
}
