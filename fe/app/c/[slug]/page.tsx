"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "@/lib/toast";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/use-translation";
import { Navbar } from "@/components/navbar";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageTransition } from "@/components/ui/page-transition";
import { ImageFallback } from "@/components/ui/image-fallback";
import { formatCredit } from "@/lib/utils";
import { ListSkeleton } from "@/components/ui/skeleton";
import { CheckCircle, Users, Heart, MessageCircle, Share2, Trophy, Star, Package, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ReportButton } from "@/components/report-button";
import type { CreatorPage, Post, Product, MembershipTier, Membership, PaginatedResponse, ApiResponse } from "@/lib/types";

export default function CreatorPageView() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showDonate, setShowDonate] = useState(false);
  const [subscribing, setSubscribing] = useState("");
  const [donateAmount, setDonateAmount] = useState("");
  const [donateMsg, setDonateMsg] = useState("");
  const [donating, setDonating] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState(false);
  const [donateError, setDonateError] = useState("");

  const { data: creator, isLoading } = useQuery({
    queryKey: ["creator", slug],
    queryFn: async () => { const { data } = await api.get<ApiResponse<CreatorPage>>(`/creators/${slug}`); return data.data; },
  });

  const { data: posts } = useQuery({
    queryKey: ["creator-posts", creator?.user_id],
    enabled: !!creator?.user_id,
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Post>>(`/posts/creator/${creator!.user_id}?status=published`); return data.data; },
  });

  const { data: topSupporters } = useQuery({
    queryKey: ["top-supporters", creator?.user_id],
    enabled: !!creator?.user_id,
    queryFn: async () => { const { data } = await api.get(`/donations/creator/${creator!.user_id}/top`); return (data.data || []) as MembershipTier[]; },
  });

  const { data: membershipTiers } = useQuery({
    queryKey: ["membership-tiers", creator?.user_id],
    enabled: !!creator?.user_id,
    queryFn: async () => { const { data } = await api.get(`/membership-tiers/${creator!.user_id}`); return (data.data || []) as MembershipTier[]; },
  });

  const { data: myMemberships } = useQuery({
    queryKey: ["my-memberships"],
    enabled: !!user,
    queryFn: async () => { const { data } = await api.get("/memberships/my"); return (data.data || []) as Membership[]; },
  });
  const subscribedTierID = myMemberships?.find((m) => m.creator_id === creator?.user_id)?.tier_id;

  const { data: products } = useQuery({
    queryKey: ["creator-products", creator?.user_id],
    enabled: !!creator?.user_id,
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Product>>(`/products/creator/${creator!.user_id}`); return data.data; },
  });

  const { data: followStatus } = useQuery({
    queryKey: ["follow-status", creator?.user_id],
    enabled: !!creator?.user_id && !!user,
    queryFn: async () => { const { data } = await api.get(`/follow/${creator!.user_id}`); return data.data.is_following as boolean; },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => { if (followStatus) await api.delete(`/follow/${creator!.user_id}`); else await api.post(`/follow/${creator!.user_id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["follow-status", creator?.user_id] }); qc.invalidateQueries({ queryKey: ["creator", slug] }); },
  });

  if (isLoading) return <><Navbar /><div className="p-8"><ListSkeleton count={3} /></div></>;
  if (!creator) return <><Navbar /><div className="p-8 text-center text-gray-500 dark:text-gray-400">{t("creator_page.not_found")}</div></>;

  const isOwn = user?.id === creator.user_id;
  const donatePresets = [5, 10, 25, 50, 100];
  const accentColor = creator.page_color || "#2563EB";

  const handleDonate = async () => {
    if (!user) { window.location.href = "/login"; return; }
    setDonating(true); setDonateError("");
    try {
      await api.post("/checkout/donation", {
        creator_id: creator.user_id, amount_idr: parseInt(donateAmount) * 1000,
        message: donateMsg || undefined, donor_name: user.display_name, is_anonymous: false, provider: "credits",
      });
      setDonateSuccess(true); setDonateAmount(""); setDonateMsg("");
      qc.invalidateQueries({ queryKey: ["creator", slug] });
    } catch (err: any) {
      const msg = err.response?.data?.error || t("common.error");
      setDonateError(msg.includes("Credit") || msg.includes("insufficient") ? t("creator_page.insufficient_credit") : msg);
    } finally { setDonating(false); }
  };

  return (
    <>
      <Navbar />
      <PageTransition>
      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-0 sm:py-6">
        {/* Banner */}
        <div className="relative">
          {creator.header_image ? (
            <div className="h-44 sm:h-56 w-full sm:rounded-3xl overflow-hidden">
              <ImageFallback src={creator.header_image} alt={`${creator.display_name} banner`} width={1200} height={400} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:rounded-3xl" />
            </div>
          ) : (
            <div className="h-44 sm:h-56 w-full sm:rounded-3xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99, ${accentColor}55)` }}>
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            </div>
          )}
        </div>

        {/* Profile card — overlapping banner */}
        <div className="relative -mt-16 sm:-mt-20 mx-2 sm:mx-0">
          <Card className="overflow-visible">
            <CardContent className="p-5 sm:p-7">
              {/* Avatar + info */}
              <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4">
                <div className="-mt-16 sm:-mt-20 shrink-0">
                  <div className="rounded-2xl ring-4 ring-white dark:ring-navy-800 overflow-hidden shadow-elevated">
                    {creator.avatar_url ? (
                      <img loading="lazy" src={creator.avatar_url} alt="" className="h-24 w-24 sm:h-28 sm:w-28 object-cover" />
                    ) : (
                      <div className="h-24 w-24 sm:h-28 sm:w-28 flex items-center justify-center text-3xl font-black text-white" style={{ background: accentColor }}>
                        {creator.display_name?.[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">{creator.display_name}</h1>
                    {creator.is_verified && <CheckCircle className="h-5 w-5 text-primary" />}
                    {creator.tier_badge === "Pro" && <Badge variant="pro" className="text-[10px]">Pro</Badge>}
                    {creator.tier_badge === "Business" && <Badge variant="business" className="text-[10px]">Business</Badge>}
                    {creator.is_priority && <Badge variant="secondary" className="text-[10px]">⭐ Featured</Badge>}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">@{creator.username}</p>
                </div>

                {/* Stats pills */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-black" style={{ color: accentColor }}>{creator.follower_count}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t("creator_page.followers")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black">{posts?.length || 0}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t("creator_page.posts")}</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {creator.bio && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">{creator.bio}</p>
              )}

              {/* Social links */}
              {creator.social_links && Object.values(creator.social_links).some(Boolean) && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {Object.entries(creator.social_links).filter(([, v]) => v).map(([k, v]) => (
                    <a key={k} href={String(v).startsWith("http") ? String(v) : `https://${v}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full transition-colors">
                      <ExternalLink className="h-3 w-3" />{k}
                    </a>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-5 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                {isOwn ? (
                  <>
                    <Link href="/dashboard/profile"><Button size="sm" variant="outline" className="rounded-2xl">{t("creator_page.edit_profile")}</Button></Link>
                    <Button size="sm" variant="ghost" className="rounded-2xl" onClick={() => {
                      const url = window.location.href + "?ref=" + creator.username;
                      navigator.share ? navigator.share({ title: creator.display_name, url }) : navigator.clipboard.writeText(url).then(() => toast.success(t("post_card.link_copied")));
                    }}><Share2 className="h-4 w-4 mr-1" /> {t("creator_page.share")}</Button>
                  </>
                ) : user ? (
                  <>
                    <Button size="sm" onClick={() => toggleFollow.mutate()} className="rounded-2xl"
                      style={!followStatus ? { backgroundColor: accentColor, borderColor: accentColor, color: 'white' } : undefined}
                      variant={followStatus ? "outline" : "default"}>
                      {followStatus ? t("creator_page.unfollow") : t("creator_page.follow")}
                    </Button>
                    <Button size="sm" variant="secondary" className="rounded-2xl" onClick={() => setShowDonate(true)}>
                      <Heart className="h-4 w-4 mr-1" /> {t("creator_page.donate")}
                    </Button>
                    <Link href={`/chat?creator=${creator.user_id}&price=${creator.chat_price_idr || 0}`}>
                      <Button size="sm" variant="outline" className="rounded-2xl">
                        <MessageCircle className="h-4 w-4 mr-1" /> {t("creator_page.chat")} {(creator.chat_price_idr ?? 0) > 0 ? `(${(creator.chat_price_idr ?? 0) / 1000}C)` : ""}
                      </Button>
                    </Link>
                    <ReportButton targetType="user" targetId={creator.user_id} />
                  </>
                ) : (
                  <Link href="/login"><Button size="sm" className="rounded-2xl" style={{ backgroundColor: accentColor, color: 'white' }}>{t("creator_page.follow")}</Button></Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar cards — donation goal, top supporters, membership */}
        <div className="grid sm:grid-cols-2 gap-3 mt-4 mx-2 sm:mx-0">
          {/* Donation Goal */}
          {creator.donation_goal_amount > 0 && creator.donation_goal_title && (
            <Card hover>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                    <span className="text-sm">🎯</span>
                  </div>
                  <p className="text-sm font-bold flex-1 truncate">{creator.donation_goal_title}</p>
                </div>
                <div className="h-2.5 bg-primary-50 dark:bg-navy-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((creator.donation_goal_current / creator.donation_goal_amount) * 100, 100)}%`, backgroundColor: accentColor }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
                  <span>{formatCredit(creator.donation_goal_current)}</span>
                  <span>{Math.min(Math.round((creator.donation_goal_current / creator.donation_goal_amount) * 100), 100)}%</span>
                  <span>{formatCredit(creator.donation_goal_amount)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Supporters */}
          {topSupporters && topSupporters.length > 0 && (
            <Card hover>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center"><Trophy className="h-4 w-4 text-accent-600" /></div>
                  <p className="text-sm font-bold">{t("creator_page.top_supporter")}</p>
                </div>
                <div className="space-y-2">
                  {topSupporters.slice(0, 5).map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`text-[10px] font-black w-5 text-center ${i === 0 ? "text-accent-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-gray-300"}`}>{i + 1}</span>
                      <span className="flex-1 truncate text-xs">{s.donor_name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{s.donation_count}x</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Membership Tiers */}
        {membershipTiers && membershipTiers.length > 0 && (
          <div className="mt-4 mx-2 sm:mx-0">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center"><Star className="h-4 w-4 text-purple-500" /></div>
                  <p className="text-sm font-bold">{t("creator_page.become_member")}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {membershipTiers.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-primary-50/50 dark:bg-navy-800 border border-primary-100 dark:border-primary-900/30">
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-[10px] text-gray-400">{t.price_credits} {t("creator_page.per_month")}</p>
                        {t.perks && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{t.perks}</p>}
                      </div>
                      {user && !isOwn && (
                        subscribedTierID === t.id ? (
                          <Badge variant="success" className="text-[10px]">✓ {t("creator_page.member")}</Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="rounded-xl text-xs" disabled={subscribing === t.id} onClick={async () => {
                            setSubscribing(t.id);
                            try { await api.post("/memberships/subscribe", { tier_id: t.id }); toast.success(t("creator_page.success")); qc.invalidateQueries({ queryKey: ["my-memberships"] }); } catch (e: any) { toast.error(e.response?.data?.error || t("common.error")); }
                            finally { setSubscribing(""); }
                          }}>{subscribing === t.id ? "..." : `${t.price_credits}C`}</Button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Tabs */}
        <div className="mt-6 sm:mt-8 mx-2 sm:mx-0">
          <Tabs defaultValue="posts">
            <TabsList>
              <TabsTrigger value="posts" count={posts?.length}><FileText className="h-4 w-4 mr-1" /> {t("creator_page.posts")}</TabsTrigger>
              <TabsTrigger value="catalog" count={products?.length}><Package className="h-4 w-4 mr-1" /> {t("creator_page.catalog")}</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-5">
              <div className="space-y-4">
                {posts?.map((post) => <PostCard key={post.id} post={post} />)}
                {posts?.length === 0 && (
                  <div className="text-center py-16">
                    <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3"><FileText className="h-7 w-7 text-primary" /></div>
                    <p className="font-semibold">{t("creator_page.no_posts")}</p>
                    <p className="text-xs text-gray-400 mt-1">{t("creator_page.no_posts_subtitle")}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="catalog" className="mt-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products?.map((p) => (
                  <Link key={p.id} href={`/products/${p.id}`}>
                    <Card clickable className="overflow-hidden h-full">
                      {p.thumbnail_url ? (
                        <ImageFallback src={p.thumbnail_url} alt={p.name} width={400} height={300} className="h-32 sm:h-40 w-full object-cover" />
                      ) : (
                        <div className="h-32 sm:h-40 w-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-navy-800 dark:to-navy-900 flex items-center justify-center text-3xl">
                          {p.type === "ebook" ? "📖" : p.type === "preset" ? "🎨" : p.type === "template" ? "📄" : "📦"}
                        </div>
                      )}
                      <CardContent className="p-3.5">
                        <p className="font-semibold text-sm truncate">{p.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-black" style={{ color: accentColor }}>{formatCredit(p.price_idr)}</span>
                          <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{p.sales_count} {t("creator_page.sold")}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {products?.length === 0 && (
                  <div className="text-center py-16 col-span-full">
                    <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-3"><Package className="h-7 w-7 text-purple-500" /></div>
                    <p className="font-semibold">{t("creator_page.no_products")}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      </PageTransition>

      {/* Donate FAB + Panel */}
      {!isOwn && (
        <>
          <button
            onClick={() => setShowDonate(!showDonate)}
            className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 h-14 w-14 rounded-2xl text-white shadow-lg shadow-primary/30 flex items-center justify-center text-xl hover:scale-105 active:scale-95 transition-all"
            style={{ backgroundColor: accentColor }}
            title={t("creator_page.donate")}
          >
            <Heart className="h-6 w-6" />
          </button>

          {showDonate && (
            <>
              <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden" onClick={() => setShowDonate(false)} />
              <div className="fixed bottom-0 sm:bottom-24 right-0 sm:right-6 z-50 w-full sm:w-96 sm:rounded-2xl overflow-hidden">
                <Card className="shadow-elevated border-0 sm:border rounded-t-3xl sm:rounded-2xl">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                          <Heart className="h-4 w-4" style={{ color: accentColor }} />
                        </div>
                        <p className="font-bold">{t("creator_page.support", creator.display_name)}</p>
                      </div>
                      <button onClick={() => setShowDonate(false)} className="h-8 w-8 rounded-xl bg-primary-50 dark:bg-navy-800 flex items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
                    </div>

                    {donateSuccess ? (
                      <div className="text-center py-4">
                        <div className="text-4xl mb-2">🎉</div>
                        <p className="font-bold text-green-600">{t("creator_page.donation_sent")}</p>
                        <p className="text-xs text-gray-400 mt-1">{t("creator_page.thanks")}</p>
                        <Button size="sm" className="mt-4 rounded-xl" onClick={() => setDonateSuccess(false)}>{t("creator_page.donate_again")}</Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {donatePresets.map((p) => (
                            <button key={p} onClick={() => setDonateAmount(String(p))}
                              className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-bold transition-all ${donateAmount === String(p) ? "text-white shadow-md" : "bg-primary-50 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-navy-700"}`}
                              style={donateAmount === String(p) ? { backgroundColor: accentColor } : undefined}>
                              {p}
                            </button>
                          ))}
                        </div>
                        <Input type="number" placeholder={t("creator_page.other_amount")} value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} />
                        <Input placeholder={t("creator_page.message_optional")} value={donateMsg} onChange={(e) => setDonateMsg(e.target.value)} maxLength={500} />
                        {donateError && <p className="text-xs text-red-500">{donateError}</p>}
                        {donateError.includes("Top-up") && <Link href="/wallet/topup" className="text-xs text-primary hover:underline">Top-up Credit →</Link>}
                        <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleDonate}
                          disabled={donating || !donateAmount || parseInt(donateAmount) < 1}
                          style={{ backgroundColor: accentColor }}>
                          {donating ? t("creator_page.sending") : t("creator_page.send_credit", donateAmount ? donateAmount + " Credit" : "")}
                        </Button>
                        <p className="text-[10px] text-gray-400 text-center">{t("creator_page.paid_with_credit")}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
