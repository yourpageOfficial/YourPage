"use client";

import { useState } from "react";
import { statusColor, statusLabel } from "@/components/ui/standards";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useTranslation } from "@/lib/use-translation";
import { useAdminList } from "@/lib/use-admin-list";
import { AdminList } from "@/components/admin-list";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBulkSelect } from "@/lib/use-bulk-select";
import { toast } from "@/lib/toast";
import { formatIDR, formatDate } from "@/lib/utils";

export default function AdminTopups() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const list = useAdminList("admin-topups", "/admin/credit-topups");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const bulk = useBulkSelect();
  const pendingIds = list.items.filter((t: any) => t.status === "pending").map((t: any) => t.id);

  const bulkApprove = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.post(`/admin/credit-topups/${id}/approve`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topups"] }); toast.success(String(bulk.count) + " topup " + t("admin.approve").toLowerCase()); bulk.clear(); },
  });
  const bulkReject = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.post(`/admin/credit-topups/${id}/reject`, { admin_note: "Bulk rejected" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topups"] }); toast.success(String(bulk.count) + " topup " + t("admin.reject").toLowerCase()); bulk.clear(); },
  });
  const approve = useMutation({ mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/approve`, { admin_note: notes[id] }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topups"] }) });
  const reject = useMutation({ mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/reject`, { admin_note: notes[id] || t("admin.status_rejected") }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topups"] }) });

  const filters = [
    { label: t("admin_topup.pending"), value: "pending" },
    { label: t("admin_topup.paid"), value: "paid" },
    { label: t("admin_topup.failed"), value: "failed" }
  ];
  const sorts = [
    { label: t("admin_common.amount"), key: "amount_idr" },
    { label: t("wallet.credits"), key: "credits" },
    { label: t("admin_topup.donor"), key: "donor_name" },
    { label: t("admin_common.date"), key: "created_at" },
    { label: t("admin_common.status"), key: "status" }
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Top-up" }]} className="mb-4" />
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t("admin_topup.title")}</h1>
      {bulk.count > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-primary/10 rounded-xl">
          <span className="text-sm font-medium">{t("admin_topup.selected", String(bulk.count))}</span>
          <Button size="sm" onClick={() => bulkApprove.mutate()} disabled={bulkApprove.isPending}>✅ {t("admin_topup.approve_all")}</Button>
          <ConfirmDialog title={t("admin_topup.reject_all_confirm_title")} message={t("admin_topup.reject_all_confirm_message", String(bulk.count))} confirmLabel={t("admin_topup.reject_all")} variant="destructive" onConfirm={() => bulkReject.mutate()}>
            {(open) => <Button size="sm" variant="destructive" onClick={open} disabled={bulkReject.isPending}>❌ {t("admin_topup.reject_all")}</Button>}
          </ConfirmDialog>
          <Button size="sm" variant="ghost" onClick={bulk.clear}>{t("common.cancel")}</Button>
        </div>
      )}
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t("admin_topup.search_placeholder")}
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-3">
          {pendingIds.length > 0 && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={bulk.count === pendingIds.length && pendingIds.length > 0} onChange={() => bulk.toggleAll(pendingIds)} className="rounded" />
              {t("admin_topup.select_all_pending", String(pendingIds.length))}
            </label>
          )}
          {list.items.map((t: any) => (
            <Card key={t.id} className={bulk.selected.has(t.id) ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {t.status === "pending" && <input type="checkbox" checked={bulk.selected.has(t.id)} onChange={() => bulk.toggle(t.id)} className="rounded" />}
                    <p className="text-xl font-bold">{formatIDR(t.amount_idr)} → {t.credits} {t("admin_topup.credit")}</p>
                  </div>
                  <Badge className={statusColor[t.status] || ""}>{statusLabel[t.status] || t.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">{t("admin_topup.donor")}:</span> {t.donor_name}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("admin_topup.user")}:</span> {t.user?.username || t.user_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("admin_topup.unique_code")}:</span> <span className="font-bold text-primary">{t.unique_code || "-"}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("admin_topup.date")}:</span> {formatDate(t.created_at)}</div>
                </div>
                {t.proof_image_url && <a href={t.proof_image_url} target="_blank"><img loading="lazy" src={t.proof_image_url} alt={t("admin_topup.proof")} className="max-h-48 rounded border object-contain" /></a>}
                {t.admin_note && <p className="text-sm bg-primary-50/50 dark:bg-navy-800 p-2 rounded">Note: {t.admin_note}</p>}
                {t.status === "pending" && <>
                  <Input placeholder={t("admin_topup.note")} value={notes[t.id] || ""} onChange={(e) => setNotes({ ...notes, [t.id]: e.target.value })} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve.mutate(t.id)}>{t("admin_topup.approve")}</Button>
                    <ConfirmDialog title={t("admin_topup.reject_confirm_title")} message={t("admin_topup.reject_confirm_message", formatIDR(t.amount_idr))} confirmLabel={t("admin_topup.reject")} variant="destructive" onConfirm={() => reject.mutate(t.id)}>
                      {(open) => <Button size="sm" variant="destructive" onClick={open}>{t("admin_topup.reject")}</Button>}
                    </ConfirmDialog>
                  </div>
                </>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("admin_topup.no_data")}</p>}
        </div>
      </AdminList>
    </div>
  );
}
