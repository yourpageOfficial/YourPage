"use client";

import { useState } from "react";
import { statusColor, statusLabel } from "@/components/ui/standards";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAdminList } from "@/lib/use-admin-list";
import { AdminList } from "@/components/admin-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";
import { Undo2, Edit } from "lucide-react";

const filters = [{ label: "Menunggu", value: "pending" }, { label: "Dibayar", value: "paid" }, { label: "Gagal", value: "failed" }, { label: "Dikembalikan", value: "refunded" }];
const sorts = [{ label: "Amount", key: "amount_idr" }, { label: "Provider", key: "provider" }, { label: "Usecase", key: "usecase" }, { label: "Date", key: "created_at" }, { label: "Status", key: "status" }];

export default function AdminPayments() {
  const qc = useQueryClient();
  const list = useAdminList("admin-payments", "/admin/payments");
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

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
        <h1 className="text-xl sm:text-xl sm:text-2xl font-bold">Pembayaran</h1>
        <Button size="sm" variant="outline" onClick={async () => {
          const res = await api.get("/admin/export/payments", { responseType: "blob" });
          const url = URL.createObjectURL(res.data);
          const a = document.createElement("a"); a.href = url; a.download = "payments.csv"; a.click();
        }}>📥 Export CSV</Button>
      </div>
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder="Cari payer, provider..."
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
                    {p.unique_code > 0 && <span className="text-xs text-primary font-medium ml-1">Kode: {p.unique_code}</span>}
                  </div>
                  <Badge className={statusColor[p.status] || ""}>{statusLabel[p.status] || p.status}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Provider:</span> {p.provider}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Usecase:</span> {p.usecase}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Fee:</span> {formatIDR(p.fee_idr)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Net:</span> {formatIDR(p.net_amount_idr)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Payer:</span> {p.payer?.username || "-"}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Date:</span> {formatDate(p.created_at)}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {p.status === "paid" && (
                    <>
                      <Input placeholder="Alasan refund" value={notes[p.id] || ""} onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })} className="h-8 text-sm flex-1" />
                      <Button size="sm" variant="destructive" onClick={() => refund.mutate(p.id)} disabled={refund.isPending}>
                        <Undo2 className="mr-1 h-3 w-3" /> Refund
                      </Button>
                    </>
                  )}
                  {editId === p.id ? (
                    <div className="flex gap-2 flex-1">
                      <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="expired">Expired</option>
                        <option value="refunded">Refunded</option>
                      </select>
                      <Button size="sm" onClick={() => updateStatus.mutate({ id: p.id, status: editStatus })}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => { setEditId(p.id); setEditStatus(p.status); }}>
                      <Edit className="mr-1 h-3 w-3" /> Edit Status
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada payment.</p>}
        </div>
      </AdminList>
    </div>
  );
}
