"use client";

import { ListSkeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PostCard } from "@/components/post-card";
import type { Post, PaginatedResponse } from "@/lib/types";
import Link from "next/link";
import { Rss, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CreatorFeed() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Post>>("/feed"); return data.data; },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-black tracking-tight">Feed</h1>
        <Link href="/explore" className="text-sm text-primary hover:underline font-medium">Explore Kreator →</Link>
      </div>
      {isLoading && <ListSkeleton count={3} />}
      {isError && (
        <Card><CardContent className="p-8 text-center">
          <p className="text-red-500 mb-2">Gagal memuat feed.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="rounded-xl">Coba lagi</Button>
        </CardContent></Card>
      )}
      {!isLoading && !isError && data?.length === 0 && (
        <Card><CardContent className="p-10 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3"><Rss className="h-7 w-7 text-primary" /></div>
          <p className="font-semibold">Feed kosong</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Follow kreator lain untuk melihat konten mereka</p>
          <Link href="/explore"><Button className="mt-4 rounded-2xl">Explore Kreator</Button></Link>
        </CardContent></Card>
      )}
      <div className="space-y-5">{data?.map((p) => <PostCard key={p.id} post={p} />)}</div>
    </div>
  );
}
