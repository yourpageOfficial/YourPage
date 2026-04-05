"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatIDR } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { TrendingUp, FileText, Package, Heart, Users, ShoppingCart, Lock } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const { data: earnings, isError: earningsError } = useQuery({
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

  if (earningsError) {
    return <div className="text-center py-12 text-sm text-red-500">Gagal memuat data. Coba refresh halaman.</div>;
  }

  if (!isPro) {
    return (
      <div className="text-center py-12">
        <Lock className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-lg font-bold mb-2">Analytics Advanced</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Fitur ini tersedia untuk tier Pro dan Business.</p>
        <Link href="/dashboard/subscription"><Button>Upgrade Sekarang</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Analytics</h1>
        {isBusiness && (
          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const res = await api.get("/creator/sales/export", { responseType: "blob" });
              const url = URL.createObjectURL(res.data);
              const a = document.createElement("a"); a.href = url; a.download = "sales.csv"; a.click();
            } catch { toast.error("Gagal export. Pastikan tier Business aktif."); }
          }}>📥 Export CSV</Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={FileText} label="Total Posts" value={analytics?.post_count ?? 0} />
        <StatCard icon={Package} label="Total Produk" value={analytics?.product_count ?? 0} />
        <StatCard icon={Users} label="Followers" value={analytics?.follower_count ?? 0} />
        <StatCard icon={ShoppingCart} label="Total Penjualan" value={analytics?.sales_count ?? 0} color="text-green-600" />
        <StatCard icon={TrendingUp} label="Revenue" value={formatCredit(analytics?.total_sales ?? 0)} color="text-green-600" />
        <StatCard icon={Heart} label="Donasi Diterima" value={`${analytics?.donation_count ?? 0} (${formatCredit(analytics?.total_donations ?? 0)})`} color="text-pink-600" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendapatan</p>
            <p className="text-2xl font-bold text-green-600">{formatCredit(analytics?.total_earnings ?? 0)} Credit</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">≈ {formatIDR(analytics?.total_earnings ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Tersedia</p>
            <p className="text-2xl font-bold text-primary"><a href="/wallet" className="hover:underline">Lihat Wallet →</a></p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Fee: {analytics?.fee_percent ?? 20}%</p>
          </CardContent>
        </Card>
      </div>

      {!isBusiness && (
        <Card className="mt-6 border-dashed">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Upgrade ke Business untuk export CSV dan fitur tambahan</p>
            <Link href="/dashboard/subscription"><Button size="sm" variant="outline">Upgrade ke Business</Button></Link>
          </CardContent>
        </Card>
      )}
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
