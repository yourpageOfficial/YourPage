"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PostCard } from "@/components/post-card";
import { PostSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/internationalization";
import type { Post, PaginatedResponse } from "@/lib/types";

export default function SupporterPosts() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["library-posts"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Post>>("/library/posts"); return data.data; },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t.supporterHub.purchasedPosts}</h1>
      {isLoading && <div className="space-y-4">{[1,2,3].map(i => <PostSkeleton key={i} />)}</div>}
      {!isLoading && data?.length === 0 && (
        <Card><CardContent className="p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3"><FileText className="h-7 w-7 text-primary" /></div>
          <p className="font-display font-semibold">{t.supporterHub.emptyPurchasedPosts}</p>
          <p className="text-sm text-gray-400 mt-1">{t.supporterHub.emptyPurchasedPostsDesc}</p>
          <Link href="/explore"><Button variant="outline" size="sm" className="mt-4 rounded-2xl">{t.supporterHub.exploreCreators}</Button></Link>
        </CardContent></Card>
      )}
      <div className="space-y-4">{data?.map((p) => <PostCard key={p.id} post={p} />)}</div>
    </div>
  );
}
