"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { formatCredit, formatIDR } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { TrendingUp, FileText, Package, Heart, Users, ShoppingCart, Lock, Download, Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const { data: earnings, isError } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { const { data } = await api.get("/creator/earnings"); return data.data; },
  });

  const tierExpired = earnings?.tier_expires_at ? new Date(earnings.tier_expires_at) < new Date() : false;
  const isPro = !tierExpired && (earnings?.tier_name === "Pro" || earnings?.tier_name === "Business");
  const isBusiness = !tierExpired && earnings?.tier_name === "Business";

  const { data: analytics } = useQuery({
    queryKey: ["creator-analytics"],
    queryFn: async () => { const { data } = await api.get("/creator/analytics"); return data.data; },
    enabled: isPro,
  });

  if (isError) return <div className="text-center py-12 text-sm text-red-500">Gagal memuat data.</div>;

  if (!isPro) {
    return (
      <div className="text-center py-16">
        <div className="h-16 w-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4"><Lock className="h-8 w-8 text-primary" /></div>
        <h2 className="text-xl font-display font-black">Analytics Advanced</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">Tersedia untuk tier Pro dan Business.</p>
        <Link href="/dashboard/subscription"><Button className="rounded-2xl">Upgrade Sekarang</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]} className="mb-4" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-black tracking-tight">Analytics</h1>
        {isBusiness && (
          <Button size="sm" variant="outline" className="rounded-2xl" onClick={async () => {
            try {
              const res = await api.get("/creator/sales/export", { responseType: "blob" });
              const url = URL.createObjectURL(res.data);
              const a = document.createElement("a"); a.href = url; a.download = "sales.csv"; a.click();
            } catch { toast.error("Gagal export."); }
          }}><Download className="mr-1.5 h-4 w-4" /> Export CSV</Button>
        )}
      </div>

      {/* Hero earnings — full width */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <Card className="lg:col-span-2 bg-gradient-to-br from-accent-50 to-white dark:from-accent-900/10 dark:to-navy-800 overflow-hidden relative">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent/5 rounded-full blur-2xl" />
          <CardContent className="p-6 relative">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Pendapatan</p>
            <p className="text-4xl sm:text-5xl font-black text-accent-600 dark:text-accent-400 mt-2">{formatCredit(analytics?.total_earnings ?? 0)}</p>
            <p className="text-sm text-gray-400 mt-1">≈ {formatIDR(analytics?.total_earnings ?? 0)}</p>
            <Link href="/wallet" className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 mt-3">
              <Wallet className="h-3 w-3" /> Lihat Wallet <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fee Tier</p>
              <p className="text-3xl font-black mt-2">{analytics?.fee_percent ?? 20}%</p>
            </div>
            {!isBusiness && (
              <Link href="/dashboard/subscription" className="text-xs text-primary font-semibold hover:underline mt-3">
                Upgrade untuk fee lebih rendah →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats grid — 3x2 bento */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={FileText} label="Posts" value={analytics?.post_count ?? 0} color="text-primary" bg="bg-primary-50 dark:bg-primary-900/20" />
        <StatCard icon={Package} label="Produk" value={analytics?.product_count ?? 0} color="text-secondary" bg="bg-secondary-50 dark:bg-secondary-900/20" />
        <StatCard icon={Users} label="Followers" value={analytics?.follower_count ?? 0} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" />
        <StatCard icon={ShoppingCart} label="Penjualan" value={analytics?.sales_count ?? 0} color="text-green-500" bg="bg-green-50 dark:bg-green-900/20" />
        <StatCard icon={TrendingUp} label="Revenue" value={formatCredit(analytics?.total_sales ?? 0)} color="text-green-500" bg="bg-green-50 dark:bg-green-900/20" />
        <StatCard icon={Heart} label="Donasi" value={`${analytics?.donation_count ?? 0} (${formatCredit(analytics?.total_donations ?? 0)})`} color="text-pink-500" bg="bg-pink-50 dark:bg-pink-900/20" />
      </div>

      {!isBusiness && (
        <Card className="border-dashed border-accent/40">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Upgrade ke Business untuk export CSV</p>
            <Link href="/dashboard/subscription"><Button size="sm" variant="outline" className="rounded-2xl">Upgrade ke Business</Button></Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: any; color: string; bg: string }) {
  return (
    <Card hover className="group">
      <CardContent className="p-4 sm:p-5">
        <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className={`font-black text-lg mt-0.5 truncate ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
