"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatIDR } from "@/lib/utils";
import Link from "next/link";

export default function AdminPromoPage() {
  const t = useTranslations("AdminPromo");

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

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">{t("title")}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{creators.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("total_creators")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{featured?.length || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("featured")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{tiers?.length || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("tiers_available")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{creators.filter((c: any) => c.is_verified).length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("verified_stat")}</p>
        </CardContent></Card>
      </div>

      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">{t("featured_creators")}</h2>
      {featured?.length ? (
        <div className="space-y-2 mb-6">
          {featured.map((c: any) => (
            <Card key={c.user_id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {c.avatar_url ? <img src={c.avatar_url} className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{c.display_name?.[0]}</div>}
                  <div>
                    <p className="font-medium">{c.display_name} <span className="text-gray-400 text-sm">@{c.username}</span></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.follower_count} {t("followers_label")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.is_verified && <Badge className="bg-blue-600 text-white text-xs">{t("verified_badge")}</Badge>}
                  <Link href={`/admin/users/${c.user_id}`}><Button size="sm" variant="outline">{t("edit_promo")}</Button></Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("empty_featured")}</p>
      )}

      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">{t("all_creators")}</h2>
      <div className="space-y-2">
        {creators.map((c: any) => (
          <Card key={c.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => window.location.href = `/admin/users/${c.id}`}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {c.avatar_url ? <img src={c.avatar_url} className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">{c.display_name?.[0]}</div>}
                <div>
                  <p className="text-sm font-medium">{c.display_name} <span className="text-gray-400 text-xs">@{c.username}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.is_verified && <Badge className="bg-blue-600 text-white text-[10px]">✓</Badge>}
                <Button size="sm" variant="ghost" className="text-xs">🎯 {t("set_promo")}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mt-6 mb-3">{t("tier_pricing")}</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {(tiers || []).map((tier: any) => (
          <Card key={tier.id}>
            <CardContent className="p-4">
              <p className="font-bold">{tier.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{tier.price_idr === 0 ? t("free_tier") : formatIDR(tier.price_idr) + t("per_month")}</p>
              <p className="text-xs mt-1">{t("fee_label")} {tier.fee_percent}% · {t("products_label")} {tier.max_products === -1 ? "∞" : tier.max_products} · {(tier.storage_bytes/(1024**3)).toFixed(0)} GB</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
