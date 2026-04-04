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
import { useBulkSelect } from "@/lib/use-bulk-select";
import { toast } from "@/lib/toast";
import { formatIDR, formatDate } from "@/lib/utils";

export default function AdminTopups() {
  const t = useTranslations("AdminTopups");

  const filters = [{ label: t("pending"), value: "pending" }, { label: t("paid"), value: "paid" }, { label: t("failed"), value: "failed" }];
  const sorts = [{ label: t("amount"), key: "amount_idr" }, { label: t("credits"), key: "credits" }, { label: t("donor"), key: "donor_name" }, { label: t("date"), key: "created_at" }, { label: t("status"), key: "status" }];

  const qc = useQueryClient();
  const list = useAdminList("admin-topups", "/admin/credit-topups");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const bulk = useBulkSelect();
  const pendingIds = list.items.filter((item: any) => item.status === "pending").map((item: any) => item.id);

  const bulkApprove = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.post(`/admin/credit-topups/${id}/approve`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topups"] }); toast.success(t("topup_approved", { count: bulk.count })); bulk.clear(); },
  });
  const bulkReject = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.post(`/admin/credit-topups/${id}/reject`, { admin_note: "Bulk rejected" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topups"] }); toast.success(t("topup_rejected", { count: bulk.count })); bulk.clear(); },
  });
  const approve = useMutation({ mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/approve`, { admin_note: notes[id] }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topups"] }) });
  const reject = useMutation({ mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/reject`, { admin_note: notes[id] }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topups"] }) });

  return (
    <div>
      <h1 className="mb-6 text-xl sm:text-2xl font-bold">{t("title")}</h1>
      {bulk.count > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
          <span className="text-sm font-medium">{bulk.count} {t("selected")}</span>
          <Button size="sm" onClick={() => bulkApprove.mutate()} disabled={bulkApprove.isPending}>✅ {t("approve_all")}</Button>
          <Button size="sm" variant="destructive" onClick={() => bulkReject.mutate()} disabled={bulkReject.isPending}>❌ {t("reject_all")}</Button>
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
              {t("select_all_pending", { count: pendingIds.length })}
            </label>
          )}
          {list.items.map((item: any) => (
            <Card key={item.id} className={bulk.selected.has(item.id) ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.status === "pending" && <input type="checkbox" checked={bulk.selected.has(item.id)} onChange={() => bulk.toggle(item.id)} className="rounded" />}
                    <p className="text-xl font-bold">{t("amount_format", { amount: formatIDR(item.amount_idr), credits: item.credits })}</p>
                  </div>
                  <Badge className={statusColor[item.status] || ""}>{item.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">{t("donor_label")}</span> {item.donor_name}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("user_label")}</span> {item.user?.username || item.user_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("unique_code_label")}</span> <span className="font-bold text-primary">{item.unique_code || "-"}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("date_label")}</span> {formatDate(item.created_at)}</div>
                </div>
                {item.proof_image_url && <a href={item.proof_image_url} target="_blank"><img src={item.proof_image_url} alt={t("proof_alt")} className="max-h-48 rounded border object-contain" /></a>}
                {item.admin_note && <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">{t("note_label")} {item.admin_note}</p>}
                {item.status === "pending" && <>
                  <Input placeholder={t("note_placeholder")} value={notes[item.id] || ""} onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve.mutate(item.id)}>{t("approve")}</Button>
                    <Button size="sm" variant="destructive" onClick={() => reject.mutate(item.id)}>{t("reject")}</Button>
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
