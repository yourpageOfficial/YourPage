"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatIDR, formatCredit } from "@/lib/utils";
import { ListSkeleton } from "@/components/ui/skeleton";
import { CheckCircle, Users } from "lucide-react";
import Link from "next/link";
import { ReportButton } from "@/components/report-button";
import type { CreatorPage, Post, Product, PaginatedResponse, ApiResponse } from "@/lib/types";

export default function CreatorPageView() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"posts" | "catalog">("posts");
  const [showDonate, setShowDonate] = useState(true);
  const [donateAmount, setDonateAmount] = useState("");
  const [donateMsg, setDonateMsg] = useState("");
  const [donating, setDonating] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState(false);
  const [donateError, setDonateError] = useState("");

  const { data: creator, isLoading } = useQuery({
    queryKey: ["creator", slug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CreatorPage>>(`/creators/${slug}`);
      return data.data;
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["creator-posts", creator?.user_id],
    enabled: !!creator?.user_id,
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Post>>(`/posts/creator/${creator!.user_id}?status=published`);
      return data.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["creator-products", creator?.user_id],
    enabled: !!creator?.user_id,
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Product>>(`/products/creator/${creator!.user_id}`);
      return data.data;
    },
  });

  const { data: followStatus } = useQuery({
    queryKey: ["follow-status", creator?.user_id],
    enabled: !!creator?.user_id && !!user,
    queryFn: async () => {
      const { data } = await api.get(`/follow/${creator!.user_id}`);
      return data.data.is_following as boolean;
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (followStatus) await api.delete(`/follow/${creator!.user_id}`);
      else await api.post(`/follow/${creator!.user_id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-status", creator?.user_id] });
      qc.invalidateQueries({ queryKey: ["creator", slug] });
    },
  });

  if (isLoading) return <><Navbar /><div className="p-8"><ListSkeleton count={3} /></div></>;
  if (!creator) return <><Navbar /><div className="p-8 text-center text-gray-500 dark:text-gray-400">Kreator tidak ditemukan</div></>;

  const isOwn = user?.id === creator.user_id;
  const donatePresets = [5, 10, 25, 50, 100]; // in Credits

  const handleDonate = async () => {
    if (!user) { window.location.href = "/login"; return; }
    setDonating(true); setDonateError("");
    try {
      await api.post("/checkout/donation", {
        creator_id: creator.user_id,
        amount_idr: parseInt(donateAmount) * 1000, // Credit to IDR
        message: donateMsg || undefined,
        donor_name: user.display_name,
        is_anonymous: false,
        provider: "credits",
      });
      setDonateSuccess(true);
      setDonateAmount(""); setDonateMsg("");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Gagal";
      setDonateError(msg.includes("Credit") || msg.includes("insufficient") ? "Credit tidak cukup. Top-up dulu." : msg);
    } finally { setDonating(false); }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-8">
        {/* Header banner with page color */}
        {creator.page_color && !creator.header_image && (
          <div className="h-32 sm:h-40 w-full rounded-xl" style={{ background: `linear-gradient(135deg, ${creator.page_color}, ${creator.page_color}88)` }} />
        )}
        {creator.header_image && (
          <div className="h-32 sm:h-48 w-full rounded-xl overflow-hidden relative">
            <img src={creator.header_image} alt="" className="h-full w-full object-cover" />
            {creator.page_color && <div className="absolute inset-0" style={{ background: `${creator.page_color}33` }} />}
          </div>
        )}
        {!creator.page_color && !creator.header_image && (
          <div className="h-32 sm:h-40 w-full rounded-xl bg-gradient-to-r from-primary/80 to-primary/40" />
        )}

        {/* Profile info */}
        <div className="relative -mt-12 sm:-mt-14 mx-2 sm:mx-0">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start sm:flex-row gap-4">
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt="" className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 shadow -mt-14 sm:-mt-16 shrink-0"
                  style={{ borderColor: creator.page_color || 'white' }} />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white -mt-14 sm:-mt-16 border-4 shadow shrink-0"
                  style={{ backgroundColor: creator.page_color || 'var(--primary)', borderColor: 'white' }}>
                  {creator.display_name[0]}
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">{creator.display_name}</h1>
              {creator.is_verified && <CheckCircle className="h-5 w-5 text-blue-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />}
              {creator.tier_badge === "Pro" && <Badge className="text-xs bg-blue-600 text-white shadow-md">Pro</Badge>}
              {creator.tier_badge === "Business" && <Badge className="text-xs bg-purple-600 text-white shadow-md">Business</Badge>}
              {creator.is_priority && <Badge className="text-xs bg-yellow-500 text-white shadow-md">⭐ Priority</Badge>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{creator.username}</p>
            {creator.bio && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 max-w-lg">{creator.bio}</p>}
            <p className="mt-2 flex items-center justify-center sm:justify-start gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4" /> {creator.follower_count} followers
            </p>
            <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
              {isOwn ? (
                <>
                  <Link href="/dashboard/profile"><Button size="sm" variant="outline">Edit Profile</Button></Link>
                  <Button size="sm" variant="ghost" onClick={() => {
                    const url = window.location.href + "?ref=" + creator.username;
                    navigator.share ? navigator.share({ title: creator.display_name, url }) : navigator.clipboard.writeText(url).then(() => alert("Referral link disalin!"));
                  }}>Share</Button>
                </>
              ) : user ? (
                <>
                  <Button size="sm" onClick={() => toggleFollow.mutate()}
                    style={!followStatus && creator.page_color ? { backgroundColor: creator.page_color, borderColor: creator.page_color, color: 'white' } : undefined}
                    variant={followStatus ? "outline" : "default"}>
                    {followStatus ? "Unfollow" : "Follow"}
                  </Button>
                  <ReportButton targetType="user" targetId={creator.user_id} />
                  <Link href={`/chat?creator=${creator.user_id}&price=${creator.chat_price_idr || 0}`}>
                    <Button size="sm" variant="outline">
                      💬 Chat {(creator.chat_price_idr ?? 0) > 0 ? `(${(creator.chat_price_idr ?? 0) / 1000} Credit)` : ""}
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/login"><Button size="sm" style={creator.page_color ? { backgroundColor: creator.page_color, color: 'white' } : undefined}>Follow</Button></Link>
              )}
            </div>
          </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mt-6 sm:mt-8 flex gap-1 border-b dark:border-gray-700 overflow-x-auto">
          {[
            { key: "posts", label: `Post (${posts?.length ?? 0})` },
            { key: "catalog", label: `Catalog (${products?.length ?? 0})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? "border-primary text-primary" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
              style={tab === t.key && creator.page_color ? { color: creator.page_color, borderColor: creator.page_color } : undefined}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {tab === "posts" && (
            <div className="space-y-4">
              {posts?.map((post) => <PostCard key={post.id} post={post} />)}
              {posts?.length === 0 && <p className="text-gray-500 text-sm">Belum ada post.</p>}
            </div>
          )}

          {tab === "catalog" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products?.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt={p.name} className="h-28 sm:h-40 w-full object-cover" />
                    ) : (
                      <div className="h-28 sm:h-40 w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl sm:text-3xl font-bold text-gray-300 dark:text-gray-600">
                        {p.type === "ebook" ? "📖" : p.type === "preset" ? "🎨" : p.type === "template" ? "📄" : "📦"}
                      </div>
                    )}
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold" style={{ color: creator.page_color || 'var(--primary)' }}>{formatCredit(p.price_idr)}</span>
                        <Badge className="text-[10px]">{p.type}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{p.sales_count} terjual</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {products?.length === 0 && <p className="text-gray-500 text-sm col-span-full">Belum ada produk.</p>}
            </div>
          )}
        </div>
      </main>

      {/* Donation Widget - floating side panel */}
      {!isOwn && (
        <>
          <button
            onClick={() => setShowDonate(!showDonate)}
            className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center text-lg sm:text-xl hover:scale-110 transition-transform"
            title="Kirim Donasi"
          >💰</button>

          {showDonate && (
            <div className="fixed bottom-36 sm:bottom-24 right-3 sm:right-6 z-50 w-[calc(100%-1.5rem)] sm:w-80">
              <Card className="shadow-xl border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Dukung {creator.display_name}</p>
                    <button onClick={() => setShowDonate(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">✕</button>
                  </div>

                  {donateSuccess ? (
                    <div className="text-center py-2">
                      <p className="text-green-600 font-semibold">🎉 Donasi terkirim!</p>
                      <Button size="sm" className="mt-2" onClick={() => setDonateSuccess(false)}>Lagi</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {donatePresets.map((p) => (
                          <Button key={p} size="sm" variant={donateAmount === String(p) ? "default" : "outline"} className="text-xs h-7" onClick={() => setDonateAmount(String(p))}>
                            {p} Credit
                          </Button>
                        ))}
                      </div>
                      <Input type="number" placeholder="Nominal lain (min 1 Credit)" value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} className="h-8 text-sm" />
                      <Input placeholder="Pesan (opsional)" value={donateMsg} onChange={(e) => setDonateMsg(e.target.value)} className="h-8 text-sm" maxLength={500} />
                      {donateError && <p className="text-xs text-red-600">{donateError}</p>}
                      {donateError.includes("Top-up") && <a href="/wallet/topup" className="text-xs text-primary hover:underline">Top-up Credit →</a>}
                      <Button size="sm" className="w-full" onClick={handleDonate} disabled={donating || !donateAmount || parseInt(donateAmount) < 1}
                        style={creator.page_color ? { backgroundColor: creator.page_color, borderColor: creator.page_color } : undefined}>
                        {donating ? "..." : `Kirim ${donateAmount ? donateAmount + " Credit" : ""}`}
                      </Button>
                      <p className="text-[10px] text-gray-400 text-center">Dibayar dengan Credit</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
}
