"use client";

import { ListSkeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PostCard } from "@/components/post-card";
import type { Post, PaginatedResponse } from "@/lib/types";
import Link from "next/link";

export default function CreatorFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Post>>("/feed"); return data.data; },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feed</h1>
        <Link href="/explore" className="text-sm text-primary hover:underline">Explore Kreator →</Link>
      </div>
      {isLoading && <ListSkeleton count={3} />}
      {data?.length === 0 && <p className="text-gray-500 dark:text-gray-400">Follow kreator lain untuk melihat konten mereka.</p>}
      <div className="space-y-6">{data?.map((p) => <PostCard key={p.id} post={p} />)}</div>
    </div>
  );
}
