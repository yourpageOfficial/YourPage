"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useState } from "react";

const roleBadge: Record<string, string> = { admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400", creator: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400", supporter: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400" };

export default function AdminUserDetail() {
  const t = useTranslations("AdminUsers");
  const tc = useTranslations("Common");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/users?limit=100`);
      return (data.data as any[]).find((u: any) => u.id === id) || null;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["admin-user-payments", id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/payments?limit=50`);
      return (data.data as any[]).filter((p: any) => p.payer_id === id);
    },
  });

  const { data: donations } = useQuery({
    queryKey: ["admin-user-donations", id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/donations?limit=50`);
      return (data.data as any[]).filter((d: any) => d.supporter_id === id || d.creator_id === id);
    },
  });

  const ban = useMutation({
    mutationFn: () => api.post(`/admin/users/${id}/ban`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user", id] }),
  });
  const unban = useMutation({
    mutationFn: () => api.post(`/admin/users/${id}/unban`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user", id] }),
  });

  const [promoFee, setPromoFee] = useState("");
  const [promoDays, setPromoDays] = useState("90");
  const [featured, setFeatured] = useState(false);
  const [promoNote, setPromoNote] = useState("");
  const setPromo = useMutation({
    mutationFn: () => api.post(`/admin/users/${id}/promo`, {
      promo_fee_percent: promoFee ? parseInt(promoFee) : null,
      promo_days: parseInt(promoDays) || 0,
      featured,
      note: promoNote,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-user", id] }); toast.success(t("promo_updated")); },
    onError: (e: any) => toast.error(e.response?.data?.error || tc("error")),
  });

  if (!user) return <ListSkeleton count={3} />;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")} className="mb-4">
        <ArrowLeft className="mr-1 h-4 w-4" /> {tc("back")}
      </Button>

      <Card className="mb-6">
        <CardHeader><CardTitle>{t("detail_title")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold">{user.display_name?.[0]}</div>
            )}
            <div>
              <p className="text-xl font-bold">{user.display_name}</p>
              <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
              <div className="flex gap-2 mt-1">
                <Badge className={roleBadge[user.role] || ""}>{user.role}</Badge>
                {user.is_banned && <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{tc("banned")}</Badge>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div><span className="text-gray-500 dark:text-gray-400">ID:</span> {user.id}</div>
            <div><span className="text-gray-500 dark:text-gray-400">{tc("created")}:</span> {formatDate(user.created_at)}</div>
            {user.bio && <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">Bio:</span> {user.bio}</div>}
          </div>
          <div className="flex gap-2 pt-2">
            {user.role === "creator" && <Link href={`/c/${user.username}`}><Button size="sm" variant="outline">{t("view_page")}</Button></Link>}
            {user.is_banned
              ? <Button size="sm" onClick={() => unban.mutate()}>{t("unban")}</Button>
              : user.role !== "admin" && <Button size="sm" variant="destructive" onClick={() => ban.mutate()}>{t("ban_user")}</Button>
            }
          </div>
        </CardContent>
      </Card>

      {user.role === "creator" && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{t("promo_title")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">{t("fee_label")}</label>
                <Input type="number" placeholder="Empty = use tier" value={promoFee} onChange={e => setPromoFee(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">{t("duration_days")}</label>
                <Input type="number" value={promoDays} onChange={e => setPromoDays(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="rounded" />
              {t("featured_homepage")}
            </label>
            <Input placeholder={t("admin_note_optional")} value={promoNote} onChange={e => setPromoNote(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setPromo.mutate()}>{t("save_promo")}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setPromoFee(""); setPromoDays("90"); setFeatured(false); setPromoNote(""); setPromo.mutate(); }}>{t("reset_promo")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle>{t("payment_history", { count: payments?.length || 0 })}</CardTitle></CardHeader>
        <CardContent>
          {payments?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("no_payments")}</p>}
          <div className="space-y-2">
            {payments?.slice(0, 20).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b pb-2">
                <div>
                  <span className="font-medium">Rp {p.amount_idr?.toLocaleString()}</span>
                  <span className="text-gray-500 ml-2">{p.usecase} · {p.provider}</span>
                  {p.status === "refunded" && <span className="text-purple-500 ml-1">· {t("refunded")}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={p.status === "paid" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : p.status === "refunded" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" : ""}>{p.status}</Badge>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(p.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("donation_history", { count: donations?.length || 0 })}</CardTitle></CardHeader>
        <CardContent>
          {donations?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("no_donations")}</p>}
          <div className="space-y-2">
            {donations?.slice(0, 20).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between text-sm border-b pb-2">
                <div>
                  <span className="font-medium">Rp {d.amount_idr?.toLocaleString()}</span>
                  <span className="text-gray-500 ml-2">
                    {d.supporter_id === id ? "→ " + (d.creator?.username || t("creator_fallback")) : "← " + (d.supporter?.username || d.donor_name)}
                  </span>
                  {d.message && <span className="text-gray-400 ml-1 text-xs">&ldquo;{d.message}&rdquo;</span>}
                </div>
                <Badge className={d.status === "paid" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : ""}>{d.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
