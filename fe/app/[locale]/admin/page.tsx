"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR, formatDate } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Users, FileText, Package, CreditCard, Banknote, Heart, ShieldCheck, Flag, TrendingUp, CheckCircle, X } from "lucide-react";
import Link from "next/link";
import { ListSkeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const t = useTranslations("Admin");
  const tc = useTranslations("Common");
  const qc = useQueryClient();

  const { data: a, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => { const { data } = await api.get("/admin/analytics"); return data.data as Record<string, any>; },
  });

  const { data: pendingKyc } = useQuery({
    queryKey: ["admin-kyc-pending"],
    queryFn: async () => { const { data } = await api.get("/admin/kyc?status=pending&limit=5"); return data.data as any[]; },
  });
  const { data: pendingWd } = useQuery({
    queryKey: ["admin-wd-pending"],
    queryFn: async () => { const { data } = await api.get("/admin/withdrawals?status=pending&limit=5"); return data.data as any[]; },
  });
  const { data: pendingTopup } = useQuery({
    queryKey: ["admin-topup-pending"],
    queryFn: async () => { const { data } = await api.get("/admin/credit-topups?status=pending&limit=5"); return data.data as any[]; },
  });

  const approveKyc = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/kyc/${id}`, { status: "approved" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-kyc-pending"] }); qc.invalidateQueries({ queryKey: ["admin-analytics"] }); toast.success(t("kyc_approved")); },
  });
  const approveWd = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/withdrawals/${id}`, { status: "approved" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wd-pending"] }); qc.invalidateQueries({ queryKey: ["admin-analytics"] }); toast.success(t("withdrawal_approved")); },
  });
  const approveTopup = useMutation({
    mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topup-pending"] }); qc.invalidateQueries({ queryKey: ["admin-analytics"] }); toast.success(t("topup_approved")); },
  });
  const rejectKyc = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/kyc/${id}`, { status: "rejected" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-kyc-pending"] }); toast.success(t("kyc_rejected")); },
  });
  const rejectWd = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/withdrawals/${id}`, { status: "rejected" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wd-pending"] }); toast.success(t("withdrawal_rejected")); },
  });
  const rejectTopup = useMutation({
    mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/reject`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topup-pending"] }); toast.success(t("topup_rejected")); },
  });

  if (isLoading || !a) return <ListSkeleton count={6} />;

  return (
    <div>
      <h1 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">{t("title")}</h1>

      {(pendingTopup?.length || pendingWd?.length || pendingKyc?.length) ? (
        <div className="space-y-3 mb-6">
          {pendingTopup?.map((t: any) => (
            <Card key={t.id} className="border-yellow-300 dark:border-yellow-700">
              <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <CreditCard className="h-5 w-5 text-yellow-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t("topup_pending", { code: formatIDR(t.amount_idr) })} → {t.credits} Credit</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.donor_name} · {t.user?.username || t.user_id?.slice(0,8)} · {formatDate(t.created_at)}</p>
                  {t.proof_image_url && <a href={t.proof_image_url} target="_blank" className="text-xs text-primary hover:underline">{t("view_proof")}</a>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => approveTopup.mutate(t.id)}><CheckCircle className="mr-1 h-3 w-3" /> {t("approve")}</Button>
                  <Button size="sm" variant="ghost" onClick={() => rejectTopup.mutate(t.id)}><X className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {pendingWd?.map((w: any) => (
            <Card key={w.id} className="border-blue-300 dark:border-blue-700">
              <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <Banknote className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t("withdrawal_pending", { code: formatIDR(w.amount_idr) })}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{w.bank_name} — {w.account_number} ({w.account_name}) · {w.creator?.username || ""}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => approveWd.mutate(w.id)}><CheckCircle className="mr-1 h-3 w-3" /> {t("approve")}</Button>
                  <Button size="sm" variant="ghost" onClick={() => rejectWd.mutate(w.id)}><X className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {pendingKyc?.map((k: any) => (
            <Card key={k.id} className="border-purple-300 dark:border-purple-700">
              <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-purple-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t("kyc_pending", { name: k.full_name })}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{k.user?.username || k.user_id?.slice(0,8)} · {formatDate(k.created_at)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => approveKyc.mutate(k.id)}><CheckCircle className="mr-1 h-3 w-3" /> {t("approve")}</Button>
                  <Button size="sm" variant="ghost" onClick={() => rejectKyc.mutate(k.id)}><X className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-6 border-green-300 dark:border-green-700">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400">{t("no_pending")}</p>
          </CardContent>
        </Card>
      )}

      <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">{t("revenue_title")}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={TrendingUp} label={t("gmv")} value={formatIDR(a.gmv || 0)} color="text-green-600" />
        <StatCard icon={CreditCard} label={t("revenue_fee")} value={formatIDR(a.revenue || 0)} color="text-primary" />
        <StatCard icon={Heart} label={t("donations_label")} value={formatIDR(a.total_donations_amount || 0)} color="text-pink-600" />
        <StatCard icon={Banknote} label={t("withdrawn")} value={formatIDR(a.withdrawals_processed_amount || 0)} color="text-orange-600" />
      </div>

      <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">{t("platform_title")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard icon={Users} label={t("users_stat")} value={a.total_users} />
        <StatCard icon={Users} label={t("creators_stat")} value={a.total_creators} color="text-blue-600" />
        <StatCard icon={FileText} label={t("posts_stat")} value={a.total_posts} />
        <StatCard icon={Package} label={t("products_stat")} value={a.total_products} />
        <StatCard icon={Flag} label={t("reports")} value={`${a.reports_pending} ${t("pending_label")}`} color={a.reports_pending > 0 ? "text-red-600" : ""} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Link href="/admin/users"><Button variant="outline" size="sm" className="w-full">{t("users_btn")}</Button></Link>
        <Link href="/admin/payments"><Button variant="outline" size="sm" className="w-full">{t("payments_btn")}</Button></Link>
        <Link href="/admin/reports"><Button variant="outline" size="sm" className="w-full">{t("reports_btn")}</Button></Link>
        <Link href="/admin/profit"><Button variant="outline" size="sm" className="w-full">{t("profit_btn")}</Button></Link>
      </div>
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
