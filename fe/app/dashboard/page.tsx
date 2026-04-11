"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { CreatorEarnings, Sale } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { formatCredit } from "@/lib/utils";
import { TrendingUp, Wallet, Users, HardDrive, CheckCircle, Circle, ArrowRight, FileText, Package, Banknote, Eye, Sparkles, Zap, Crown } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DashboardOverview() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data as CreatorEarnings; } catch { return null; } },
  });

  const { data: sales } = useQuery({
    queryKey: ["creator-sales-chart"],
    queryFn: async () => { try { const { data } = await api.get("/creator/sales?limit=7"); return (data.data || []) as Sale[]; } catch { return []; } },
  });

  const { data: kyc } = useQuery({
    queryKey: ["my-kyc"],
    queryFn: async () => { try { const { data } = await api.get("/kyc"); return data.data; } catch { return null; } },
  });

  if (isLoading) return <ListSkeleton count={4} />;

  const storageGB = data ? (data.storage_used_bytes / (1024 * 1024 * 1024)).toFixed(1) : "0";
  const quotaGB = data?.storage_quota_bytes ? (data.storage_quota_bytes / (1024 * 1024 * 1024)).toFixed(0) : "1";
  const storagePct = data?.storage_quota_bytes ? Math.min((data.storage_used_bytes / data.storage_quota_bytes) * 100, 100) : 0;

  const checks = [
    { done: !!user?.avatar_url, label: "Upload avatar", href: "/dashboard/profile", emoji: "📸" },
    { done: !!user?.bio, label: "Tulis bio", href: "/dashboard/profile", emoji: "✍️" },
    { done: (data?.post_count ?? 0) > 0, label: "Buat post pertama", href: "/dashboard/posts", emoji: "📝" },
    { done: !!kyc, label: "Verifikasi KYC", href: "/dashboard/kyc", emoji: "🪪" },
  ];
  const allDone = checks.every((c) => c.done);
  const doneCount = checks.filter(c => c.done).length;

  const recentSales = (sales || []).slice(0, 7).reverse();
  const maxAmount = recentSales.length > 0 ? Math.max(...recentSales.map((s: any) => s.net_amount_idr || 0), 1) : 1;
  const totalRecentSales = recentSales.reduce((s: number, x: any) => s + (x.net_amount_idr || 0), 0);

  const tierIcon = data?.tier_name === "Business" ? Crown : data?.tier_name === "Pro" ? Zap : Sparkles;
  const TierIcon = tierIcon;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Selamat pagi";
    if (h < 17) return "Selamat siang";
    return "Selamat malam";
  };

  return (
    <PageTransition>
    <div className="space-y-5">

      {/* === Hero greeting + earnings === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Greeting — spans 2 cols */}
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-primary-600 via-primary to-primary-800 dark:from-primary-900 dark:via-primary-800 dark:to-navy-900 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative">
            <p className="text-primary-200 text-sm font-medium">{greeting()} 👋</p>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight mt-1">{user?.display_name || user?.username}</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                <TierIcon className="h-4 w-4 text-accent" />
                <span className="font-bold">{data?.tier_name || "Free"}</span>
              </div>
              <span className="text-primary-200 text-sm">Fee {data?.fee_percent ?? 20}%</span>
            </div>
            {/* Quick action row */}
            <div className="flex gap-2 mt-5">
              <Link href="/dashboard/posts"><Button size="sm" variant="secondary" className="rounded-full text-xs h-8 px-4 shadow-lg">✏️ Post Baru</Button></Link>
              <Link href={`/c/${user?.creator_profile?.page_slug || user?.username}`}><Button size="sm" className="rounded-full text-xs h-8 px-4 bg-white/15 hover:bg-white/25 border-0 text-white shadow-none"><Eye className="h-3.5 w-3.5 mr-1" /> Halaman Saya</Button></Link>
            </div>
          </div>
        </div>

        {/* Earnings highlight */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-50 to-white dark:from-accent-900/10 dark:to-navy-800 opacity-50" />
          <CardContent className="p-6 relative h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Earnings</p>
                <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-accent-600" /></div>
              </div>
              <p className="text-3xl sm:text-4xl font-black mt-3 text-accent-600 dark:text-accent-400">{formatCredit(data?.total_earnings ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-1">Credit</p>
            </div>
            <Link href="/dashboard/analytics" className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 mt-4">
              Lihat detail <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* === Stats row === */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card hover className="group">
          <CardContent className="p-4 sm:p-5 text-center">
            <div className="h-11 w-11 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black mt-2 text-purple-600 dark:text-purple-400">{data?.follower_count ?? 0}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Followers</p>
          </CardContent>
        </Card>
        <Link href="/wallet">
          <Card hover className="group h-full">
            <CardContent className="p-4 sm:p-5 text-center">
              <div className="h-11 w-11 rounded-2xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-black mt-2 text-primary">Wallet</p>
              <p className="text-[10px] text-primary uppercase tracking-wider mt-0.5 font-medium">Lihat →</p>
            </CardContent>
          </Card>
        </Link>
        <Card hover className="group">
          <CardContent className="p-4 sm:p-5 text-center">
            <div className="h-11 w-11 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <HardDrive className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black mt-2">{storageGB}<span className="text-sm font-normal text-gray-400">GB</span></p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">/ {quotaGB} GB</p>
            <div className="w-full h-1 bg-primary-100 dark:bg-navy-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${storagePct}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Setup checklist (if not done) === */}
      {!allDone && (
        <Card className="border-accent/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-accent via-accent-300 to-primary" style={{ width: `${(doneCount / checks.length) * 100}%` }} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <p className="font-black text-sm">Setup Halaman</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{doneCount}/{checks.length}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {checks.map((c, i) => (
                <Link key={i} href={c.href}>
                  <div className={`rounded-2xl p-3 text-center transition-all border-2 ${c.done ? "border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10" : "border-primary-100 dark:border-primary-900/30 hover:border-primary/30 hover:bg-primary-50/30"}`}>
                    <span className="text-xl">{c.done ? "✅" : c.emoji}</span>
                    <p className={`text-[11px] mt-1 font-medium ${c.done ? "text-green-600 line-through" : ""}`}>{c.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Sales chart + Quick actions side by side === */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Chart — 3 cols */}
        <Card className="lg:col-span-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-black text-sm">Penjualan 7 Hari</p>
                {totalRecentSales > 0 && <p className="text-xs text-gray-400 mt-0.5">Total: <span className="text-green-500 font-bold">{formatCredit(totalRecentSales)}</span></p>}
              </div>
              <Link href="/dashboard/sales"><Button size="sm" variant="ghost" className="text-xs rounded-xl">Semua <ArrowRight className="h-3 w-3 ml-1" /></Button></Link>
            </div>
            {recentSales.length > 0 ? (
              <div className="flex items-end gap-1.5 h-32 sm:h-40">
                {recentSales.map((s: any, i: number) => {
                  const pct = Math.max((s.net_amount_idr / maxAmount) * 100, 6);
                  const isMax = s.net_amount_idr === maxAmount;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <span className="text-[8px] text-gray-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{(s.net_amount_idr / 1000).toFixed(0)}K</span>
                      <div className={`w-full rounded-xl transition-all cursor-default ${isMax ? "bg-gradient-to-t from-accent to-accent-300" : "bg-gradient-to-t from-primary/80 to-primary-400/60"} group-hover:from-accent group-hover:to-accent-300`} style={{ height: `${pct}%` }} />
                      <span className="text-[9px] text-gray-400 mt-1.5 font-medium">{new Date(s.created_at).getDate()}/{new Date(s.created_at).getMonth()+1}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 sm:h-40 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-2"><TrendingUp className="h-6 w-6 text-primary/40" /></div>
                <p className="text-xs text-gray-400">Belum ada data penjualan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions — 2 cols */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3 content-start">
          <Link href="/dashboard/posts" className="contents">
            <Card clickable className="group">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 rounded-2xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"><FileText className="h-5 w-5 text-primary" /></div>
                <p className="text-xs font-bold mt-2">Buat Post</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/products" className="contents">
            <Card clickable className="group">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"><Package className="h-5 w-5 text-purple-500" /></div>
                <p className="text-xs font-bold mt-2">Buat Produk</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/withdrawals" className="contents">
            <Card clickable className="group">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"><Banknote className="h-5 w-5 text-green-500" /></div>
                <p className="text-xs font-bold mt-2">Tarik Saldo</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/subscription" className="contents">
            <Card clickable className="group">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 rounded-2xl bg-accent-100 dark:bg-accent-900/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"><Sparkles className="h-5 w-5 text-accent-600" /></div>
                <p className="text-xs font-bold mt-2">Upgrade</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

    </div>
    </PageTransition>
  );
}
