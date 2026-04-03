"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PostCard } from "@/components/post-card";
import { PostSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCredit } from "@/lib/utils";
import { Wallet, Search, Heart } from "lucide-react";
import Link from "next/link";
import type { Post, PaginatedResponse, Wallet as WalletType, ApiResponse } from "@/lib/types";

export default function SupporterFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Post>>("/feed"); return data.data; },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const { data } = await api.get<ApiResponse<WalletType>>("/wallet/balance"); return data.data; },
  });

  return (
    <div>
      {/* Quick stats */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Card className="flex-1">
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Saldo Credit</p>
              <p className="text-lg font-bold">{formatCredit(wallet?.balance_credits ?? 0)}</p>
            </div>
            <Link href="/wallet/topup" className="ml-auto"><Button size="sm" variant="outline">Top-up</Button></Link>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Link href="/explore" className="flex-1"><Button variant="outline" className="w-full h-full"><Search className="mr-1 h-4 w-4" /> Explore</Button></Link>
          <Link href="/s/donations" className="flex-1"><Button variant="outline" className="w-full h-full"><Heart className="mr-1 h-4 w-4" /> Donasi</Button></Link>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">Feed</h2>
      {isLoading && <div className="space-y-4">{[1,2,3].map(i => <PostSkeleton key={i} />)}</div>}
      {data?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-3">Follow kreator untuk melihat konten mereka.</p>
            <Link href="/explore"><Button>Explore Kreator</Button></Link>
          </CardContent>
        </Card>
      )}
      <div className="space-y-6">{data?.map((p) => <PostCard key={p.id} post={p} />)}</div>
    </div>
  );
}
