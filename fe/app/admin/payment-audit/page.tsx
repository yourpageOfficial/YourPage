"use client";

import { useAdminList } from "@/lib/use-admin-list";
import { AdminList } from "@/components/admin-list";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";
import {
  ArrowDownToLine, ArrowUpFromLine, CheckCircle2, XCircle,
  ShoppingBag, Heart, MessageSquare, RotateCcw, Banknote, Activity,
} from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

export default function AdminPaymentAudit() {
  const { t, locale } = useTranslation();
  const list = useAdminList("admin-payment-audit", "/admin/payment-audit", { filterParam: "event" });

  const filters = [
    { label: t.adminFinance.filterTopupCreated, value: "topup.created" },
    { label: t.adminFinance.filterTopupPaid, value: "topup.paid" },
    { label: t.adminFinance.filterTopupApproved, value: "topup.approved" },
    { label: t.adminFinance.filterTopupRejected, value: "topup.rejected" },
    { label: t.adminFinance.filterCheckoutPost, value: "checkout.post" },
    { label: t.adminFinance.filterCheckoutProduct, value: "checkout.product" },
    { label: t.adminFinance.filterDonation, value: "checkout.donation" },
    { label: t.adminFinance.filterPaymentRefunded, value: "payment.refunded" },
    { label: t.adminFinance.filterWithdrawalStatusChanged, value: "withdrawal.status_changed" },
  ];

  const sorts = [
    { label: t.adminFinance.sortNominal, key: "amount_idr" },
    { label: t.adminFinance.sortEvent, key: "event" },
    { label: t.adminFinance.sortTanggal, key: "created_at" },
  ];

  const eventMeta: Record<string, { label: string; icon: any; className: string }> = {
    "topup.created": { label: t.adminFinance.eventTopupCreated, icon: ArrowDownToLine, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    "topup.paid": { label: t.adminFinance.eventTopupPaid, icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    "topup.approved": { label: t.adminFinance.eventTopupApproved, icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    "topup.rejected": { label: t.adminFinance.eventTopupRejected, icon: XCircle, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    "checkout.post": { label: t.adminFinance.eventCheckoutPost, icon: ShoppingBag, className: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
    "checkout.product": { label: t.adminFinance.eventCheckoutProduct, icon: ShoppingBag, className: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
    "checkout.donation": { label: t.adminFinance.eventCheckoutDonation, icon: Heart, className: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
    "checkout.chat": { label: t.adminFinance.eventCheckoutChat, icon: MessageSquare, className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    "payment.refunded": { label: t.adminFinance.eventPaymentRefunded, icon: RotateCcw, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    "withdrawal.requested": { label: t.adminFinance.eventWithdrawalRequested, icon: ArrowUpFromLine, className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    "withdrawal.status_changed": { label: t.adminFinance.eventWithdrawalStatusChanged, icon: Banknote, className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  };

  const roleLabel: Record<string, string> = {
    user: t.adminFinance.roleUser,
    admin: t.adminFinance.roleAdmin,
    finance: t.adminFinance.roleFinance,
    system: t.adminFinance.roleSystem,
  };

  const localeStr = locale === "id" ? "id-ID" : "en-US";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-black tracking-tight">{t.adminFinance.auditTitle}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t.adminFinance.auditSubtitle}
        </p>
      </div>

      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t.adminFinance.searchAuditPlaceholder}
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-2">
          {list.items.map((a: any) => {
            const meta = eventMeta[a.event] || { label: a.event, icon: Activity, className: "bg-gray-100 text-gray-700 dark:bg-navy-800 dark:text-gray-300" };
            const Icon = meta.icon;
            return (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.className}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={meta.className}>{meta.label}</Badge>
                          {a.method && <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{a.method}</span>}
                        </div>
                        <p className="text-lg font-bold tabular-nums">{formatIDR(a.amount_idr)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm sm:grid-cols-4">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelAktor}</span>{" "}
                          {a.actor?.username || (a.actor_id ? a.actor_id.slice(0, 8) + "\u2026" : "\u2014")}
                          <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({roleLabel[a.actor_role] || a.actor_role})</span>
                        </div>
                        {a.credits !== 0 && (
                          <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelCredit}</span> <span className="tabular-nums">{a.credits}</span></div>
                        )}
                        <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelRef}</span> {a.reference_type} {a.reference_id ? a.reference_id.slice(0, 8) + "\u2026" : ""}</div>
                        <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelWaktu}</span> {new Date(a.created_at).toLocaleDateString(localeStr, { day: "numeric", month: "short", year: "numeric" })}</div>
                      </div>

                      {(a.ip_address || a.detail) && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-gray-400 dark:text-gray-500">
                          {a.ip_address && <span>IP {a.ip_address}</span>}
                          {a.detail && Object.entries(a.detail).map(([k, v]) => (
                            <span key={k} className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-navy-800">
                              {k}: {String(v).length > 20 ? String(v).slice(0, 20) + "\u2026" : String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {list.items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center dark:border-navy-800">
              <Activity className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t.adminFinance.emptyAudit}</p>
            </div>
          )}
        </div>
      </AdminList>
    </div>
  );
}
