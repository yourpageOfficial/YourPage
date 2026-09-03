"use client";

import { useState } from "react";
import { statusColor, statusLabel } from "@/components/ui/standards";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
import { useTranslation } from "@/lib/internationalization";

export default function AdminTopups() {
  const { t, interpolate } = useTranslation();
  const qc = useQueryClient();
  const list = useAdminList("admin-topups", "/admin/credit-topups");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const bulk = useBulkSelect();
  const pendingIds = list.items.filter((t: any) => t.status === "pending").map((t: any) => t.id);

  const filters = [
    { label: t.adminFinance.filterPending, value: "pending" },
    { label: t.adminFinance.filterPaid, value: "paid" },
    { label: t.adminFinance.filterFailed, value: "failed" },
  ];
  const sorts = [
    { label: t.adminFinance.sortAmount, key: "amount_idr" },
    { label: t.adminFinance.sortCredits, key: "credits" },
    { label: t.adminFinance.sortDonor, key: "donor_name" },
    { label: t.adminFinance.sortDate, key: "created_at" },
    { label: t.adminFinance.sortStatus, key: "status" },
  ];

  const bulkApprove = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.post(`/admin/credit-topups/${id}/approve`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topups"] }); toast.success(interpolate(t.adminFinance.topupApprovedToast, { count: bulk.count })); bulk.clear(); },
  });
  const bulkReject = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.post(`/admin/credit-topups/${id}/reject`, { admin_note: "Bulk rejected" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topups"] }); toast.success(interpolate(t.adminFinance.topupRejectedToast, { count: bulk.count })); bulk.clear(); },
  });
  const approve = useMutation({ mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/approve`, { admin_note: notes[id] }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topups"] }) });
  const reject = useMutation({ mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/reject`, { admin_note: notes[id] || "Ditolak" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topups"] }) });

  return (
    <div>
      <Breadcrumb items={[{ label: t.adminFinance.breadcrumbAdmin, href: "/admin" }, { label: t.adminFinance.breadcrumbTopup }]} className="mb-4" />
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t.adminFinance.topupTitle}</h1>
      {bulk.count > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-primary/10 rounded-xl">
          <span className="text-sm font-medium">{bulk.count} {t.adminFinance.selectedCount}</span>
          <Button size="sm" onClick={() => bulkApprove.mutate()} disabled={bulkApprove.isPending}>{t.adminFinance.approveAll}</Button>
          <ConfirmDialog title={t.adminFinance.rejectAllTitle} message={interpolate(t.adminFinance.rejectAllMessage, { count: bulk.count })} confirmLabel={t.adminFinance.rejectAllConfirm} variant="destructive" onConfirm={() => bulkReject.mutate()}>
            {(open) => <Button size="sm" variant="destructive" onClick={open} disabled={bulkReject.isPending}>❌ {t.adminFinance.rejectAllConfirm}</Button>}
          </ConfirmDialog>
          <Button size="sm" variant="ghost" onClick={bulk.clear}>{t.common.cancel}</Button>
        </div>
      )}
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t.adminFinance.searchTopupsPlaceholder}
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-3">
          {pendingIds.length > 0 && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={bulk.count === pendingIds.length && pendingIds.length > 0} onChange={() => bulk.toggleAll(pendingIds)} className="rounded" />
              {interpolate(t.adminFinance.selectAllPending, { count: pendingIds.length })}
            </label>
          )}
          {list.items.map((item: any) => (
            <Card key={item.id} className={bulk.selected.has(item.id) ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.status === "pending" && <input type="checkbox" checked={bulk.selected.has(item.id)} onChange={() => bulk.toggle(item.id)} className="rounded" />}
                    <p className="text-xl font-bold">{formatIDR(item.amount_idr)} → {item.credits} credit</p>
                  </div>
                  <Badge className={statusColor[item.status] || ""}>{statusLabel[item.status] || item.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelDonor}</span> {item.donor_name}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelUser}</span> {item.user?.username || item.user_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelUniqueCode}</span> <span className="font-bold text-primary">{item.unique_code || "-"}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelTanggal}</span> {formatDate(item.created_at)}</div>
                </div>
                {item.proof_image_url && <a href={item.proof_image_url} target="_blank" rel="noopener noreferrer"><img loading="lazy" src={item.proof_image_url} alt="bukti" className="max-h-48 rounded border object-contain" /></a>}
                {item.admin_note && <p className="text-sm bg-primary-50/50 dark:bg-navy-800 p-2 rounded">{interpolate(t.adminFinance.notePrefix, { note: item.admin_note })}</p>}
                {item.status === "pending" && <>
                  <Input placeholder={t.adminFinance.notePlaceholder} value={notes[item.id] || ""} onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })} />
                  <div className="flex gap-2">
                    {/* Disabled while in flight: approving credits real money,
                        so a double-click must not send two requests. */}
                    <Button size="sm" onClick={() => approve.mutate(item.id)} disabled={approve.isPending || reject.isPending}>
                      {approve.isPending ? t.adminFinance.processing : t.adminFinance.approveButton}
                    </Button>
                    <ConfirmDialog title={t.adminFinance.rejectTopupTitle} message={interpolate(t.adminFinance.rejectTopupMessage, { amount: formatIDR(item.amount_idr) })} confirmLabel={t.adminFinance.rejectButton} variant="destructive" onConfirm={() => reject.mutate(item.id)}>
                      {(open) => <Button size="sm" variant="destructive" onClick={open} disabled={approve.isPending || reject.isPending}>{t.adminFinance.rejectButton}</Button>}
                    </ConfirmDialog>
                  </div>
                </>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t.adminFinance.emptyTopups}</p>}
        </div>
      </AdminList>
    </div>
  );
}
