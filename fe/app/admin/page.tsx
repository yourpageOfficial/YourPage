"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { UserKYC, Withdrawal as WithdrawalType, CreditTopup, AdminAnalytics } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatIDR, formatDate } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useTranslation } from "@/lib/use-translation";
import { Users, FileText, Package, CreditCard, Banknote, Heart, ShieldCheck, Flag, TrendingUp, CheckCircle, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ListSkeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { t } = useTranslation();

  const { data: a, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => { const { data } = await api.get("/admin/analytics"); return data.data as AdminAnalytics; },
  });

  const { data: pendingKyc } = useQuery({
    queryKey: ["admin-kyc-pending"],
    queryFn: async () => { const { data } = await api.get("/admin/kyc?status=pending&limit=5"); return (data.data || []) as UserKYC[]; },
  });
  const { data: pendingWd } = useQuery({
    queryKey: ["admin-wd-pending"],
    queryFn: async () => { const { data } = await api.get("/admin/withdrawals?status=pending&limit=5"); return (data.data || []) as UserKYC[]; },
  });
  const { data: pendingTopup } = useQuery({
    queryKey: ["admin-topup-pending"],
    queryFn: async () => { const { data } = await api.get("/admin/credit-topups?status=pending&limit=5"); return (data.data || []) as UserKYC[]; },
  });

  const approveKyc = useMutation({ mutationFn: (id: string) => api.patch(`/admin/kyc/${id}`, { status: "approved" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-kyc-pending"] }); qc.invalidateQueries({ queryKey: ["admin-analytics"] }); toast.success(t("admin.approve") + " KYC"); } });
  const approveWd = useMutation({ mutationFn: (id: string) => api.patch(`/admin/withdrawals/${id}`, { status: "approved" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wd-pending"] }); qc.invalidateQueries({ queryKey: ["admin-analytics"] }); toast.success(t("admin.approve") + " " + t("admin.withdrawals").toLowerCase()); } });
  const approveTopup = useMutation({ mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/approve`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topup-pending"] }); qc.invalidateQueries({ queryKey: ["admin-analytics"] }); toast.success(t("admin.approve") + " topup"); } });
  const rejectKyc = useMutation({ mutationFn: (id: string) => api.patch(`/admin/kyc/${id}`, { status: "rejected" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-kyc-pending"] }); toast.success(t("admin.reject") + " KYC"); } });
  const rejectWd = useMutation({ mutationFn: (id: string) => api.patch(`/admin/withdrawals/${id}`, { status: "rejected" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wd-pending"] }); toast.success(t("admin.reject") + " " + t("admin.withdrawals").toLowerCase()); } });
  const rejectTopup = useMutation({ mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/reject`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topup-pending"] }); toast.success(t("admin.reject") + " topup"); } });

  if (isLoading || !a) return <ListSkeleton count={6} />;

  return (
    <div>
      <div className="rounded-2xl bg-gradient-navy p-6 sm:p-8 mb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-gray-400 text-sm">{t("admin_dashboard.title")}</p>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">{t("admin_dashboard.dashboard")}</h1>
        </div>
      </div>

      {(pendingTopup?.length || pendingWd?.length || pendingKyc?.length) ? (
        <div className="space-y-3 mb-6">
          {pendingTopup?.map((t: any) => (
            <Card key={t.id} className="border-accent/40">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center shrink-0"><CreditCard className="h-5 w-5 text-accent-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t("admin_topup.title")} {formatIDR(t.amount_idr)} → {t.credits} {t("admin_topup.credit")}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.donor_name} · {t.user?.username || t.user_id?.slice(0,8)} · {formatDate(t.created_at)}</p>
                  {t.proof_image_url && <a href={t.proof_image_url} target="_blank" className="text-xs text-primary hover:underline">{t("admin_topup.proof")}</a>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => approveTopup.mutate(t.id)}><CheckCircle className="mr-1 h-3 w-3" /> {t("admin_topup.approve")}</Button>
                  <ConfirmDialog title={t("admin_topup.reject_confirm_title")} message={t("admin_topup.reject_confirm_message", formatIDR(t.amount_idr))} confirmLabel={t("admin_topup.reject")} variant="destructive" onConfirm={() => rejectTopup.mutate(t.id)}>
                    {(open) => <Button size="sm" variant="ghost" onClick={open}><X className="h-3 w-3" /></Button>}
                  </ConfirmDialog>
                </div>
              </CardContent>
            </Card>
          ))}

          {pendingWd?.map((w: any) => (
            <Card key={w.id} className="border-primary/40">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0"><Banknote className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t("admin_withdrawal.title")} {formatIDR(w.amount_idr)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{w.bank_name} — {w.account_number} ({w.account_name}) · {w.creator?.username || ""}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => approveWd.mutate(w.id)}><CheckCircle className="mr-1 h-3 w-3" /> {t("admin_withdrawal.approve")}</Button>
                  <ConfirmDialog title={t("admin_withdrawal.reject_confirm_title")} message={t("admin_withdrawal.reject_confirm_message", formatIDR(w.amount_idr))} confirmLabel={t("admin_withdrawal.reject")} variant="destructive" onConfirm={() => rejectWd.mutate(w.id)}>
                    {(open) => <Button size="sm" variant="ghost" onClick={open}><X className="h-3 w-3" /></Button>}
                  </ConfirmDialog>
                </div>
              </CardContent>
            </Card>
          ))}

          {pendingKyc?.map((k: any) => (
            <Card key={k.id} className="border-purple-400/40">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0"><ShieldCheck className="h-5 w-5 text-purple-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">KYC: {k.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{k.user?.username || k.user_id?.slice(0,8)} · {formatDate(k.created_at)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => approveKyc.mutate(k.id)}><CheckCircle className="mr-1 h-3 w-3" /> {t("admin_kyc.approve")}</Button>
                  <ConfirmDialog title={t("admin_kyc.reject_confirm_title")} message={t("admin_kyc.reject_confirm_message", k.full_name)} confirmLabel={t("admin_kyc.reject")} variant="destructive" onConfirm={() => rejectKyc.mutate(k.id)}>
                    {(open) => <Button size="sm" variant="ghost" onClick={open}><X className="h-3 w-3" /></Button>}
                  </ConfirmDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-6 border-green-300/40">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-500" /></div>
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">{t("admin_dashboard.all_done")}</p>
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t("admin_dashboard.revenue")}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard icon={TrendingUp} label={t("admin_dashboard.gmv")} value={formatIDR(a.gmv || 0)} color="text-green-500" bg="bg-green-50 dark:bg-green-900/20" />
        <StatCard icon={CreditCard} label={t("admin_dashboard.revenue_fee")} value={formatIDR(a.revenue || 0)} color="text-primary" bg="bg-primary-50 dark:bg-primary-900/20" />
        <StatCard icon={Heart} label={t("admin_dashboard.donations")} value={formatIDR(a.total_donations_amount || 0)} color="text-pink-500" bg="bg-pink-50 dark:bg-pink-900/20" />
        <StatCard icon={Banknote} label={t("admin_dashboard.withdrawn")} value={formatIDR(a.withdrawals_processed_amount || 0)} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-900/20" />
      </div>

      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t("admin_dashboard.platform")}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <MiniStat icon={Users} label={t("admin_dashboard.users")} value={a.total_users} />
        <MiniStat icon={Users} label={t("admin_dashboard.creators")} value={a.total_creators} />
        <MiniStat icon={FileText} label={t("admin_dashboard.posts")} value={a.total_posts} />
        <MiniStat icon={Package} label={t("admin_dashboard.products")} value={a.total_products} />
        <MiniStat icon={Flag} label={t("admin.reports")} value={t("admin_dashboard.reports_pending", String(a.reports_pending))} alert={a.reports_pending > 0} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/admin/users"><Button variant="outline" size="sm" className="w-full rounded-2xl">{t("admin_users.title")}</Button></Link>
        <Link href="/admin/payments"><Button variant="outline" size="sm" className="w-full rounded-2xl">{t("admin_payments.title")}</Button></Link>
        <Link href="/admin/reports"><Button variant="outline" size="sm" className="w-full rounded-2xl">{t("admin_reports.title")}</Button></Link>
        <Link href="/admin/profit"><Button variant="outline" size="sm" className="w-full rounded-2xl">{t("admin_profit.title")}</Button></Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: any; color: string; bg: string }) {
  return (
    <Card hover>
      <CardContent className="p-4 sm:p-5">
        <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className={`font-bold text-lg truncate ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value, alert }: { icon: any; label: string; value: any; alert?: boolean }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 flex items-center gap-3">
        <Icon className={`h-5 w-5 shrink-0 ${alert ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`} />
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className={`font-bold text-sm truncate ${alert ? "text-red-500" : ""}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
