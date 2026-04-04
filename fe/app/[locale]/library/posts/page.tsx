"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { PostCard } from "@/components/post-card";
import type { Post, PaginatedResponse } from "@/lib/types";

export default function LibraryPosts() {
  const t = useTranslations("LibraryPosts");
  const { data: posts } = useQuery({
    queryKey: ["library-posts"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Post>>("/library/posts");
      return data.data;
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("purchased_posts")}</h1>
      <div className="space-y-4">
        {posts?.map((p) => <PostCard key={p.id} post={p} />)}
        {posts?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("no_posts")}</p>}
      </div>
    </div>
  );
}
