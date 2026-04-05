"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCredit } from "@/lib/utils";
import { TrendingUp, Wallet, Users, HardDrive, CheckCircle, Circle } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardOverview() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data as any; } catch { return {}; } },
  });

  const { data: sales } = useQuery({
    queryKey: ["creator-sales-chart"],
    queryFn: async () => { try { const { data } = await api.get("/creator/sales?limit=7"); return data.data as any[]; } catch { return []; } },
  });

  const { data: kyc } = useQuery({
    queryKey: ["my-kyc"],
    queryFn: async () => { try { const { data } = await api.get("/kyc"); return data.data; } catch { return null; } },
  });

  if (isLoading) return <ListSkeleton count={4} />;

  const storageGB = data ? (data.storage_used_bytes / (1024 * 1024 * 1024)).toFixed(2) : "0";
  const quotaGB = data?.storage_quota_bytes ? (data.storage_quota_bytes / (1024 * 1024 * 1024)).toFixed(0) : "1";

  // Checklist
  const checks = [
    { done: !!user?.avatar_url, label: "Upload avatar", href: "/dashboard/profile" },
    { done: !!user?.bio, label: "Tulis bio", href: "/dashboard/profile" },
    { done: (data?.post_count ?? 0) > 0, label: "Buat post pertama", href: "/dashboard/posts" },
    { done: !!kyc, label: "Verifikasi KYC", href: "/dashboard/kyc" },
  ];
  const allDone = checks.every((c) => c.done);

  // Simple chart — last 7 sales as bar
  const recentSales = (sales || []).slice(0, 7).reverse();
  const maxAmount = recentSales.length > 0 ? Math.max(...recentSales.map((s: any) => s.net_amount_idr || 0), 1) : 1;

  return (
    <div>
      <h1 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">Ringkasan</h1>

      {!allDone && (
        <Card className="mb-6 border-primary/30 bg-primary-50/30 dark:bg-primary-900/10">
          <CardHeader className="pb-2"><CardTitle className="text-base">🚀 Setup Halaman Kamu</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checks.map((c, i) => (
                <Link key={i} href={c.href} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                  {c.done ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600" />}
                  <span className={c.done ? "line-through text-gray-400 dark:text-gray-500" : ""}>{c.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={TrendingUp} label="Total Pendapatan" value={formatCredit(data?.total_earnings ?? 0)} color="text-green-600" />
        <StatCard icon={Wallet} label="Saldo Credit" value={<Link href="/wallet" className="text-primary hover:underline">Lihat Wallet →</Link>} color="text-primary" />
        <StatCard icon={Users} label="Followers" value={data?.follower_count ?? 0} />
        <StatCard icon={HardDrive} label="Storage" value={`${storageGB} / ${quotaGB} GB`} />
      </div>

      {/* Tier info */}
      <Card className="mb-6">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Tier: <span className="font-bold">{data?.tier_name || "Free"}</span></p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fee: {data?.fee_percent ?? 15}%{data?.tier_expires_at ? ` · Aktif sampai ${new Date(data.tier_expires_at).toLocaleDateString("id-ID")}` : ""}</p>
          </div>
          <Link href="/dashboard/subscription"><Button size="sm" variant="outline">Kelola Tier</Button></Link>
        </CardContent>
      </Card>

      {/* Sales chart */}
      {recentSales.length > 0 ? (
        <Card className="mb-6">
          <CardHeader className="pb-2"><CardTitle className="text-base">Penjualan Terakhir</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-36">
              {recentSales.map((s: any, i: number) => {
                const pct = Math.max((s.net_amount_idr / maxAmount) * 100, 8);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">{(s.net_amount_idr / 1000).toFixed(0)}</span>
                    <div className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors" style={{ height: `${pct}%` }} />
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">{new Date(s.created_at).getDate()}/{new Date(s.created_at).getMonth()+1}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/dashboard/sales" className="text-xs text-primary hover:underline mt-3 inline-block">Lihat semua →</Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada penjualan. Buat konten berbayar untuk mulai menghasilkan!</p>
            <Link href="/dashboard/posts"><Button size="sm" variant="outline" className="mt-3">Buat Post</Button></Link>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <Link href="/dashboard/posts"><Button variant="outline" className="w-full text-xs h-9">✏️ Buat Post</Button></Link>
        <Link href="/dashboard/products"><Button variant="outline" className="w-full text-xs h-9">📦 Buat Produk</Button></Link>
        <Link href="/dashboard/withdrawals"><Button variant="outline" className="w-full text-xs h-9">💰 Tarik Saldo</Button></Link>
        <Link href={`/c/${user?.creator_profile?.page_slug || user?.username}`}><Button variant="outline" className="w-full text-xs h-9">👁 Lihat Halaman</Button></Link>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">Saldo bisa ditarik via menu Penarikan (min 100 Credit).</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color?: string }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 flex items-center gap-3">
        <Icon className={`h-8 w-8 shrink-0 ${color || "text-gray-400 dark:text-gray-500"}`} />
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className={`font-bold text-sm sm:text-base truncate ${color || ""}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
