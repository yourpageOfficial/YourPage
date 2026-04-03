"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useDebounce } from "@/lib/use-debounce";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, Search, TrendingUp } from "lucide-react";
import Link from "next/link";

interface CreatorItem {
  user_id: string; username: string; display_name: string;
  avatar_url?: string; page_slug: string; follower_count: number; is_verified: boolean;
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data: creators, isLoading, isError, refetch } = useQuery({
    queryKey: ["explore", debouncedQuery],
    queryFn: async () => {
      const { data } = await api.get(`/creators/search?q=${encodeURIComponent(debouncedQuery)}`);
      return (data.data || []) as CreatorItem[];
    },
  });

  const trending = creators?.filter(c => c.follower_count > 0).sort((a, b) => b.follower_count - a.follower_count).slice(0, 6);
  const results = query ? creators : [];

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-2xl px-3 sm:px-4 py-6 sm:py-8">
        <h1 className="mb-2 text-xl sm:text-2xl font-bold">Explore</h1>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Temukan kreator favoritmu</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input placeholder="Cari kreator..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>

        {/* Trending — show when not searching */}
        {!query && trending && trending.length > 0 && (
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <TrendingUp className="h-4 w-4 text-primary" /> Trending Kreator
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {trending.map((c) => (
                <Link key={c.user_id} href={`/c/${c.page_slug}`}>
                  <Card className="hover:border-primary dark:hover:border-primary transition-colors cursor-pointer h-full">
                    <CardContent className="p-3 text-center">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover mx-auto" />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg font-bold text-primary mx-auto">
                          {c.display_name[0]}
                        </div>
                      )}
                      <p className="font-medium text-sm mt-2 truncate">{c.display_name}</p>
                      {c.is_verified && <CheckCircle className="h-3 w-3 text-primary inline ml-1" />}
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 mt-1">
                        <Users className="h-3 w-3" /> {c.follower_count}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All creators — show when not searching */}
        {!query && creators && creators.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3">Semua Kreator</h2>
            <div className="space-y-2">
              {creators.map((c) => <CreatorRow key={c.user_id} c={c} />)}
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">Gagal memuat kreator.</p>
            <button onClick={() => refetch()} className="text-sm text-primary hover:underline">Coba lagi</button>
          </div>
        )}

        {/* Search results */}
        {query && !isError && (
          <div>
            {isLoading && <ListSkeleton count={3} />}
            {results && results.length > 0 && (
              <div className="space-y-2">
                {results.map((c) => <CreatorRow key={c.user_id} c={c} />)}
              </div>
            )}
            {results?.length === 0 && !isLoading && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                Tidak ada kreator untuk &ldquo;{query}&rdquo;. Coba kata kunci lain.
              </p>
            )}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}

function CreatorRow({ c }: { c: CreatorItem }) {
  return (
    <Link href={`/c/${c.page_slug}`}>
      <Card className="hover:border-primary dark:hover:border-primary transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-3 p-3">
          {c.avatar_url ? (
            <img src={c.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {c.display_name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-medium text-sm truncate">{c.display_name}</p>
              {c.is_verified && <CheckCircle className="h-3 w-3 text-primary shrink-0" />}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">@{c.username}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 shrink-0">
            <Users className="h-3 w-3" /> {c.follower_count}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
