"use client";

import { ListSkeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { PostCard } from "@/components/post-card";
import type { Post, PaginatedResponse } from "@/lib/types";
import Link from "next/link";

export default function CreatorFeed() {
  const t = useTranslations("DashboardFeed");
  const { data, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Post>>("/feed"); return data.data; },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("feed_title")}</h1>
        <Link href="/explore" className="text-sm text-primary hover:underline">{t("explore_creators")}</Link>
      </div>
      {isLoading && <ListSkeleton count={3} />}
      {data?.length === 0 && <p className="text-gray-500 dark:text-gray-400">{t("empty_feed")}</p>}
      <div className="space-y-6">{data?.map((p) => <PostCard key={p.id} post={p} />)}</div>
    </div>
  );
}
