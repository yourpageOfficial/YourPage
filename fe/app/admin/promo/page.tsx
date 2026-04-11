"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, formatIDR } from "@/lib/utils";
import Link from "next/link";

export default function AdminPromoPage() {
  const { data: users } = useQuery({
    queryKey: ["admin-users-all"],
    queryFn: async () => { const { data } = await api.get("/admin/users?limit=200"); return data.data as any[]; },
  });

  const { data: tiers } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => { const { data } = await api.get("/tiers"); return data.data as any[]; },
  });

  const { data: featured } = useQuery({
    queryKey: ["featured-creators"],
    queryFn: async () => { const { data } = await api.get("/creators/featured"); return data.data as any[]; },
  });

  const creators = (users || []).filter((u: any) => u.role === "creator");
  // We need creator profiles with promo data — get from admin endpoint
  // For now show featured + link to set promo

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Promo & Kerjasama Creator</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-display font-black tracking-tight">{creators.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Creator</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{featured?.length || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Featured</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{tiers?.length || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tier Tersedia</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{creators.filter((c: any) => c.is_verified).length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Verified</p>
        </CardContent></Card>
      </div>

      {/* Featured Creators */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">⭐ Featured Creators</h2>
      {featured?.length ? (
        <div className="space-y-2 mb-6">
          {featured.map((c: any) => (
            <Card key={c.user_id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={c.avatar_url} name={c.display_name} size="md" />
                  <div>
                    <p className="font-medium">{c.display_name} <span className="text-gray-400 text-sm">@{c.username}</span></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.follower_count} followers</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.is_verified && <Badge className="bg-primary text-white text-xs">Verified</Badge>}
                  <Link href={`/admin/users/${c.user_id}`}><Button size="sm" variant="outline">Edit Promo</Button></Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Belum ada featured creator. Set di halaman detail user.</p>
      )}

      {/* All Creators */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Semua Creator</h2>
      <div className="space-y-2">
        {creators.map((c: any) => (
          <Card key={c.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => window.location.href = `/admin/users/${c.id}`}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={c.avatar_url} name={c.display_name} size="sm" />
                <div>
                  <p className="text-sm font-medium">{c.display_name} <span className="text-gray-400 text-xs">@{c.username}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.is_verified && <Badge className="bg-primary text-white text-[10px]">✓</Badge>}
                <Button size="sm" variant="ghost" className="text-xs">🎯 Set Promo</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tier Info */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mt-6 mb-3">Tier Pricing</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {(tiers || []).map((t: any) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <p className="font-bold">{t.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.price_idr === 0 ? "Gratis" : formatIDR(t.price_idr) + "/bulan"}</p>
              <p className="text-xs mt-1">Fee: {t.fee_percent}% · Products: {t.max_products === -1 ? "∞" : t.max_products} · {(t.storage_bytes/(1024**3)).toFixed(0)} GB</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
