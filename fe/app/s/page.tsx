"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PostCard } from "@/components/post-card";
import { PostSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCredit } from "@/lib/utils";
import { Wallet, Search, Heart, FileText, Package, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/page-transition";
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
    <PageTransition>
    <div>
      {/* Top row: wallet + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        {/* Wallet — spans 2 cols */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-primary-600 via-primary to-primary-800 dark:from-primary-900 dark:via-primary-800 dark:to-navy-900 border-0 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <CardContent className="p-5 sm:p-6 flex items-center gap-4 relative">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary-200 text-xs">Saldo Credit</p>
              <p className="text-3xl font-black">{wallet?.balance_credits ?? 0}</p>
            </div>
            <Link href="/wallet/topup"><Button size="sm" variant="secondary">Top-up</Button></Link>
          </CardContent>
        </Card>

        {/* Quick actions — stacked */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          <Link href="/explore">
            <Card hover clickable className="h-full">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0"><Search className="h-4 w-4 text-primary" /></div>
                <div><p className="font-bold text-xs">Explore</p><p className="text-[10px] text-gray-400">Temukan kreator</p></div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/s/donations">
            <Card hover clickable className="h-full">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center shrink-0"><Heart className="h-4 w-4 text-pink-500" /></div>
                <div><p className="font-bold text-xs">Donasi</p><p className="text-[10px] text-gray-400">Riwayat</p></div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Feed */}
      <h2 className="text-lg font-display font-black tracking-tight mb-4">Feed</h2>
      {isLoading && <div className="space-y-4">{[1,2,3].map(i => <PostSkeleton key={i} />)}</div>}
      {!isLoading && data?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="font-display font-bold">Belum ada konten</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Follow kreator untuk melihat konten mereka.</p>
            <Link href="/explore"><Button className="mt-4 rounded-2xl">Explore Kreator</Button></Link>
          </CardContent>
        </Card>
      )}
      <div className="space-y-5">{data?.map((p) => <PostCard key={p.id} post={p} />)}</div>
    </div>
    </PageTransition>
  );
}
