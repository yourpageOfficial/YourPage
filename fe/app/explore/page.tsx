"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useDebounce } from "@/lib/use-debounce";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { PageTransition } from "@/components/ui/page-transition";
import { Users, CheckCircle, Search, Flame, Crown, Star, Compass, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerChildren, staggerItem } from "@/lib/motion-variants";

interface CreatorItem {
  user_id: string; username: string; display_name: string;
  avatar_url?: string; page_slug: string; follower_count: number; is_verified: boolean;
  category?: string;
}

const categories = ["Gaming", "Musik", "Edukasi", "Podcast", "Seni", "Teknologi", "Lifestyle", "Lainnya"];
const categoryEmoji: Record<string, string> = {
  Gaming: "🎮", Musik: "🎵", Edukasi: "📚", Podcast: "🎙️",
  Seni: "🎨", Teknologi: "💻", Lifestyle: "✨", Lainnya: "🌈",
};

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data: creators, isLoading } = useQuery({
    queryKey: ["explore", debouncedQuery, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (category) params.set("category", category);
      const { data } = await api.get(`/creators/search?${params}`);
      return (data.data || []) as CreatorItem[];
    },
  });

  const trending = creators?.filter(c => c.follower_count > 0).sort((a, b) => b.follower_count - a.follower_count).slice(0, 3);
  const results = query ? creators : [];

  return (
    <>
      <Navbar />
      <PageTransition>
        {/* Compact search bar — sticky below navbar */}
        <div className="sticky top-14 sm:top-16 z-30 bg-white/80 dark:bg-navy-900/80 backdrop-blur-lg border-b border-primary-100 dark:border-primary-900/30">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <Input
              placeholder="Cari kreator..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              iconLeft={<Search className="h-4 w-4 text-primary" />}
              iconRight={query ? <button onClick={() => setQuery("")} className="text-gray-400 hover:text-primary transition-colors cursor-pointer text-xs">✕</button> : undefined}
              className="h-11 rounded-2xl border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-navy-800"
            />
          </div>
        </div>

        <main className="mx-auto max-w-3xl px-4 py-5 sm:py-6">
          {/* Category grid — 2x4 on mobile, single row on desktop */}
          {!query && (
            <div className="mb-8">
              <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2">
                <button
                  onClick={() => setCategory("")}
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    !category
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "bg-primary-50 dark:bg-navy-800 text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-navy-800/80"
                  }`}
                >
                  <span className="text-base sm:text-sm">🔥</span>
                  <span>Semua</span>
                </button>
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(category === c ? "" : c)}
                    className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      category === c
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "bg-primary-50 dark:bg-navy-800 text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-navy-800/80"
                    }`}
                  >
                    <span className="text-base sm:text-sm">{categoryEmoji[c]}</span>
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending — horizontal scroll cards */}
          {!query && trending && trending.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-accent" />
                  </div>
                  <h2 className="font-display font-black text-base tracking-tight">Trending</h2>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
                {trending.map((c, i) => (
                  <Link key={c.user_id} href={`/c/${c.page_slug}`} className="snap-start shrink-0 w-[260px] sm:w-auto sm:flex-1">
                    <Card clickable className="h-full">
                      <CardContent className="p-0">
                        {/* Colored top strip */}
                        <div className={`h-16 rounded-t-2xl ${i === 0 ? "bg-gradient-to-r from-amber-400 to-orange-400" : i === 1 ? "bg-gradient-to-r from-primary-300 to-primary-400" : "bg-gradient-to-r from-secondary-300 to-secondary-400"}`} />
                        <div className="px-4 pb-4 -mt-8 text-center">
                          <div className="relative inline-block">
                            <Avatar src={c.avatar_url} name={c.display_name} size="xl" className="ring-4 ring-white dark:ring-navy-800" />
                            {i === 0 && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-5 text-amber-400 drop-shadow" />}
                            <span className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md ${
                              i === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500" : i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400" : "bg-gradient-to-br from-amber-600 to-amber-700"
                            }`}>{i + 1}</span>
                          </div>
                          <p className="font-bold text-sm mt-3 truncate">
                            {c.display_name}
                            {c.is_verified && <CheckCircle className="h-3.5 w-3.5 text-primary inline ml-1" />}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{c.username}</p>
                          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-primary font-semibold">
                            <Users className="h-3 w-3" /> {c.follower_count} followers
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All creators — card grid */}
          {!query && creators && creators.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Star className="h-4 w-4 text-secondary" />
                </div>
                <h2 className="font-display font-black text-base tracking-tight">Semua Kreator</h2>
                <span className="text-xs text-gray-400 ml-1">{creators.length}</span>
              </div>
              <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {creators.map((c) => (
                  <motion.div key={c.user_id} variants={staggerItem}>
                    <CreatorCard c={c} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Search results — list layout for scannability */}
          {query && (
            <div>
              {isLoading && (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-primary-100 dark:border-primary-900/20">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                    </div>
                  ))}
                </div>
              )}
              {results && results.length > 0 && (
                <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-2">
                  {results.map((c) => (
                    <motion.div key={c.user_id} variants={staggerItem}>
                      <CreatorRow c={c} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
              {results?.length === 0 && !isLoading && (
                <div className="text-center py-20">
                  <div className="h-16 w-16 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-primary/40" />
                  </div>
                  <p className="font-display font-bold">Tidak ditemukan</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Coba kata kunci lain untuk &ldquo;{query}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {/* Empty */}
          {!query && creators?.length === 0 && !isLoading && (
            <div className="text-center py-20">
              <div className="h-16 w-16 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
                <Compass className="h-8 w-8 text-primary/40" />
              </div>
              <p className="font-display font-bold">Belum ada kreator</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kreator akan muncul di sini</p>
            </div>
          )}
        </main>
      </PageTransition>
      <ScrollToTop />
    </>
  );
}

/* Card layout for grid view */
function CreatorCard({ c }: { c: CreatorItem }) {
  return (
    <Link href={`/c/${c.page_slug}`}>
      <Card clickable className="h-full">
        <CardContent className="p-4 flex flex-col items-center text-center">
          <Avatar src={c.avatar_url} name={c.display_name} size="lg" className="ring-2 ring-primary/10" />
          <p className="font-bold text-sm mt-2.5 truncate w-full">
            {c.display_name}
            {c.is_verified && <CheckCircle className="h-3 w-3 text-primary inline ml-1" />}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate w-full">@{c.username}</p>
          {c.category && (
            <span className="text-[10px] mt-1.5 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium">
              {categoryEmoji[c.category] || "🌈"} {c.category}
            </span>
          )}
          <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
            <Users className="h-3 w-3" /> {c.follower_count}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* Row layout for search results */
function CreatorRow({ c }: { c: CreatorItem }) {
  return (
    <Link href={`/c/${c.page_slug}`}>
      <Card clickable>
        <CardContent className="flex items-center gap-3.5 p-3.5">
          <Avatar src={c.avatar_url} name={c.display_name} size="md" className="ring-2 ring-primary/10" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm truncate">{c.display_name}</p>
              {c.is_verified && <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">@{c.username}</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full shrink-0">
            <Users className="h-3 w-3" /> {c.follower_count}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
