"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PostCard } from "@/components/post-card";
import type { Post, PaginatedResponse } from "@/lib/types";

export default function SupporterPosts() {
  const { data } = useQuery({
    queryKey: ["library-posts"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Post>>("/library/posts"); return data.data; },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Post yang Dibeli</h1>
      <div className="space-y-4">{data?.map((p) => <PostCard key={p.id} post={p} />)}</div>
      {data?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada post yang dibeli.</p>}
    </div>
  );
}
