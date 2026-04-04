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
import { Undo2, Edit } from "lucide-react";

export default function AdminPayments() {
  const t = useTranslations("AdminPayments");
  const tc = useTranslations("Common");

  const filters = [{ label: t("status_pending"), value: "pending" }, { label: t("status_paid"), value: "paid" }, { label: t("status_failed"), value: "failed" }, { label: t("status_refunded"), value: "refunded" }];
  const sorts = [{ label: "Amount", key: "amount_idr" }, { label: "Provider", key: "provider" }, { label: t("usecase_label"), key: "usecase" }, { label: tc("created"), key: "created_at" }, { label: "Status", key: "status" }];

  const qc = useQueryClient();
  const list = useAdminList("admin-payments", "/admin/payments");
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const refund = useMutation({
    mutationFn: (id: string) => api.post(`/admin/payments/${id}/refund`, { admin_note: notes[id] || t("refunded_by_admin") }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payments"] }); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/payments/${id}`, { status, admin_note: notes[id] || "" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payments"] }); setEditId(null); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-xl sm:text-2xl font-bold">{t("title")}</h1>
        <Button size="sm" variant="outline" onClick={async () => {
          const res = await api.get("/admin/export/payments", { responseType: "blob" });
          const url = URL.createObjectURL(res.data);
          const a = document.createElement("a"); a.href = url; a.download = t("download_file"); a.click();
        }}>📥 {t("export_csv")}</Button>
      </div>
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t("search_placeholder")}
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-2">
          {list.items.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">{formatIDR(p.amount_idr)}</p>
                    {p.unique_code > 0 && <span className="text-xs text-primary font-medium ml-1">{t("code_label")} {p.unique_code}</span>}
                  </div>
                  <Badge className={statusColor[p.status] || ""}>{p.status}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">{t("provider_label")}</span> {p.provider}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("usecase_label")}</span> {p.usecase}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("fee_label")}</span> {formatIDR(p.fee_idr)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("net_label")}</span> {formatIDR(p.net_amount_idr)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("payer_label")}</span> {p.payer?.username || "-"}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("date_label")}</span> {formatDate(p.created_at)}</div>
                </div>

                <div className="flex gap-2 pt-1">
                  {p.status === "paid" && (
                    <>
                      <Input placeholder={t("refund_reason")} value={notes[p.id] || ""} onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })} className="h-8 text-sm flex-1" />
                      <Button size="sm" variant="destructive" onClick={() => refund.mutate(p.id)} disabled={refund.isPending}>
                        <Undo2 className="mr-1 h-3 w-3" /> {t("refund")}
                      </Button>
                    </>
                  )}
                  {editId === p.id ? (
                    <div className="flex gap-2 flex-1">
                      <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        <option value="pending">{t("status_pending")}</option>
                        <option value="paid">{t("status_paid")}</option>
                        <option value="failed">{t("status_failed")}</option>
                        <option value="expired">{t("status_expired")}</option>
                        <option value="refunded">{t("status_refunded")}</option>
                      </select>
                      <Button size="sm" onClick={() => updateStatus.mutate({ id: p.id, status: editStatus })}>{t("save")}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>{t("cancel_btn")}</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => { setEditId(p.id); setEditStatus(p.status); }}>
                      <Edit className="mr-1 h-3 w-3" /> {t("edit_status")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>}
        </div>
      </AdminList>
    </div>
  );
}
