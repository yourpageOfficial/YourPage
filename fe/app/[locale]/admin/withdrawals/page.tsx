"use client";

import { useState } from "react";
import { statusColor } from "@/components/ui/standards";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { useAdminList } from "@/lib/use-admin-list";
import { AdminList } from "@/components/admin-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";
import { useBulkSelect } from "@/lib/use-bulk-select";
import { toast } from "@/lib/toast";

export default function AdminWithdrawals() {
  const t = useTranslations("AdminWithdrawals");
  const tc = useTranslations("Common");

  const filters = [{ label: t("pending"), value: "pending" }, { label: t("approved"), value: "approved" }, { label: t("processed"), value: "processed" }, { label: t("rejected"), value: "rejected" }];
  const sorts = [{ label: t("amount"), key: "amount_idr" }, { label: t("bank"), key: "bank_name" }, { label: tc("created"), key: "created_at" }, { label: t("status"), key: "status" }];

  const qc = useQueryClient();
  const list = useAdminList("admin-withdrawals", "/admin/withdrawals");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const bulk = useBulkSelect();
  const pendingIds = list.items.filter((w: any) => w.status === "pending").map((w: any) => w.id);
  const bulkApprove = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.patch(`/admin/withdrawals/${id}`, { status: "approved" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-withdrawals"] }); toast.success(t("withdrawal_approved", { count: bulk.count })); bulk.clear(); },
  });
  const bulkReject = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.patch(`/admin/withdrawals/${id}`, { status: "rejected" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-withdrawals"] }); toast.success(t("withdrawal_rejected", { count: bulk.count })); bulk.clear(); },
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/withdrawals/${id}`, { status, admin_note: notes[id] || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-withdrawals"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-xl sm:text-2xl font-bold">{t("title")}</h1>
      {bulk.count > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
          <span className="text-sm font-medium">{bulk.count} {t("selected")}</span>
          <Button size="sm" onClick={() => bulkApprove.mutate()}>{t("approve_all")}</Button>
          <Button size="sm" variant="destructive" onClick={() => bulkReject.mutate()}>{t("reject_all")}</Button>
          <Button size="sm" variant="ghost" onClick={bulk.clear}>{t("cancel")}</Button>
        </div>
      )}
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t("search_placeholder")}
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-3">
          {pendingIds.length > 0 && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={bulk.count === pendingIds.length && pendingIds.length > 0} onChange={() => bulk.toggleAll(pendingIds)} className="rounded" />
              {t("select_all")} {pendingIds.length})
            </label>
          )}
          {list.items.map((w: any) => (
            <Card key={w.id} className={bulk.selected.has(w.id) ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {w.status === "pending" && <input type="checkbox" checked={bulk.selected.has(w.id)} onChange={() => bulk.toggle(w.id)} className="rounded" />}
                    <p className="text-xl font-bold">{formatIDR(w.amount_idr)}</p>
                  </div>
                  <Badge className={statusColor[w.status] || ""}>{w.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">{t("bank_label")}</span> {w.bank_name}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("account_label")}</span> {w.account_number}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("name_label")}</span> {w.account_name}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("creator_label")}</span> {w.creator?.username || w.creator_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("date_label")}</span> {formatDate(w.created_at)}</div>
                </div>
                {w.admin_note && <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">{t("note_label")} {w.admin_note}</p>}
                {(w.status === "pending" || w.status === "approved") && <>
                  <Input placeholder={t("note_placeholder")} value={notes[w.id] || ""} onChange={(e) => setNotes({ ...notes, [w.id]: e.target.value })} />
                  <div className="flex gap-2">
                    {w.status === "pending" && <>
                      <Button size="sm" onClick={() => update.mutate({ id: w.id, status: "approved" })}>{t("approve")}</Button>
                      <Button size="sm" variant="destructive" onClick={() => update.mutate({ id: w.id, status: "rejected" })}>{t("reject")}</Button>
                    </>}
                    {w.status === "approved" && <Button size="sm" onClick={() => update.mutate({ id: w.id, status: "processed" })}>{t("mark_processed")}</Button>}
                  </div>
                </>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>}
        </div>
      </AdminList>
    </div>
  );
}
