"use client";

import { useState } from "react";
import { statusColor, statusLabel } from "@/components/ui/standards";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAdminList } from "@/lib/use-admin-list";
import { AdminList } from "@/components/admin-list";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";
import { Undo2, Edit } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

export default function AdminPayments() {
  const { t, interpolate } = useTranslation();
  const qc = useQueryClient();
  const list = useAdminList("admin-payments", "/admin/payments");
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const filters = [
    { label: t.adminFinance.filterPending, value: "pending" },
    { label: t.adminFinance.filterPaid, value: "paid" },
    { label: t.adminFinance.filterFailed, value: "failed" },
    { label: t.adminFinance.filterRefunded, value: "refunded" },
  ];
  const sorts = [
    { label: t.adminFinance.sortAmount, key: "amount_idr" },
    { label: t.adminFinance.sortProvider, key: "provider" },
    { label: t.adminFinance.sortUsecase, key: "usecase" },
    { label: t.adminFinance.sortDate, key: "created_at" },
    { label: t.adminFinance.sortStatus, key: "status" },
  ];

  const refund = useMutation({
    mutationFn: (id: string) => api.post(`/admin/payments/${id}/refund`, { admin_note: notes[id] || "Refunded by admin" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payments"] }); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/payments/${id}`, { status, admin_note: notes[id] || "" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payments"] }); setEditId(null); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-black tracking-tight">{t.adminFinance.paymentsTitle}</h1>
        <Button size="sm" variant="outline" onClick={async () => {
          const res = await api.get("/admin/export/payments", { responseType: "blob" });
          const url = URL.createObjectURL(res.data);
          const a = document.createElement("a"); a.href = url; a.download = "payments.csv"; a.click();
          URL.revokeObjectURL(url);
        }}>{t.adminFinance.exportCsv}</Button>
      </div>
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t.adminFinance.searchPaymentsPlaceholder}
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
                    {p.unique_code > 0 && <span className="text-xs text-primary font-medium ml-1">{interpolate(t.adminFinance.paymentCode, { code: p.unique_code })}</span>}
                  </div>
                  <Badge className={statusColor[p.status] || ""}>{statusLabel[p.status] || p.status}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelProvider}</span> {p.provider}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelUsecase}</span> {p.usecase}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelFee}</span> {formatIDR(p.fee_idr)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelNet}</span> {formatIDR(p.net_amount_idr)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.labelPayer}</span> {p.payer?.username || "-"}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminFinance.sortDate}:</span> {formatDate(p.created_at)}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {p.status === "paid" && (
                    <>
                      <Input placeholder={t.adminFinance.refundReasonPlaceholder} value={notes[p.id] || ""} onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })} className="h-8 text-sm flex-1" />
                      <Button size="sm" variant="destructive" onClick={() => refund.mutate(p.id)} disabled={refund.isPending}>
                        <Undo2 className="mr-1 h-3 w-3" /> {t.adminFinance.refundButton}
                      </Button>
                    </>
                  )}
                  {editId === p.id ? (
                    <div className="flex gap-2 flex-1">
                      <select className="rounded-xl border border-primary-200 dark:border-primary-900/40 bg-white dark:bg-navy-800 px-2 py-1 text-sm" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="expired">Expired</option>
                        <option value="refunded">Refunded</option>
                      </select>
                      <Button size="sm" onClick={() => updateStatus.mutate({ id: p.id, status: editStatus })}>{t.common.save}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>{t.common.cancel}</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => { setEditId(p.id); setEditStatus(p.status); }}>
                      <Edit className="mr-1 h-3 w-3" /> {t.adminFinance.editStatus}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t.adminFinance.emptyPayments}</p>}
        </div>
      </AdminList>
    </div>
  );
}
