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
import { formatIDR, formatDate } from "@/lib/utils";
import { useBulkSelect } from "@/lib/use-bulk-select";
import { toast } from "@/lib/toast";

const filters = [{ label: "Menunggu", value: "pending" }, { label: "Disetujui", value: "approved" }, { label: "Diproses", value: "processed" }, { label: "Ditolak", value: "rejected" }];
const sorts = [{ label: "Amount", key: "amount_idr" }, { label: "Bank", key: "bank_name" }, { label: "Date", key: "created_at" }, { label: "Status", key: "status" }];

export default function AdminWithdrawals() {
  const qc = useQueryClient();
  const list = useAdminList("admin-withdrawals", "/admin/withdrawals");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const bulk = useBulkSelect();
  const pendingIds = list.items.filter((w: any) => w.status === "pending").map((w: any) => w.id);
  const bulkApprove = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.patch(`/admin/withdrawals/${id}`, { status: "approved" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-withdrawals"] }); toast.success(`${bulk.count} withdrawal approved`); bulk.clear(); },
  });
  const bulkReject = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.patch(`/admin/withdrawals/${id}`, { status: "rejected" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-withdrawals"] }); toast.success(`${bulk.count} withdrawal rejected`); bulk.clear(); },
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/withdrawals/${id}`, { status, admin_note: notes[id] || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-withdrawals"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">Penarikan</h1>
      {bulk.count > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-primary/10 rounded-xl">
          <span className="text-sm font-medium">{bulk.count} dipilih</span>
          <Button size="sm" onClick={() => bulkApprove.mutate()}>✅ Setujui Semua</Button>
          <ConfirmDialog title="Tolak Semua?" message={`Yakin ingin menolak ${bulk.count} withdrawal?`} confirmLabel="Tolak Semua" variant="destructive" onConfirm={() => bulkReject.mutate()}>
            {(open) => <Button size="sm" variant="destructive" onClick={open}>❌ Tolak Semua</Button>}
          </ConfirmDialog>
          <Button size="sm" variant="ghost" onClick={bulk.clear}>Batal</Button>
        </div>
      )}
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder="Cari bank, nama rekening..."
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-3">
          {pendingIds.length > 0 && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={bulk.count === pendingIds.length && pendingIds.length > 0} onChange={() => bulk.toggleAll(pendingIds)} className="rounded" />
              Pilih semua pending ({pendingIds.length})
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
                  <Badge className={statusColor[w.status] || ""}>{statusLabel[w.status] || w.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Bank:</span> {w.bank_name}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">No. Rek:</span> {w.account_number}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Nama:</span> {w.account_name}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Creator:</span> {w.creator?.username || w.creator_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Tanggal:</span> {formatDate(w.created_at)}</div>
                </div>
                {w.admin_note && <p className="text-sm bg-primary-50/50 dark:bg-navy-800 p-2 rounded">Note: {w.admin_note}</p>}
                {(w.status === "pending" || w.status === "approved") && <>
                  <Input placeholder="Catatan (opsional)" value={notes[w.id] || ""} onChange={(e) => setNotes({ ...notes, [w.id]: e.target.value })} />
                  <div className="flex gap-2">
                    {w.status === "pending" && <>
                      <Button size="sm" onClick={() => update.mutate({ id: w.id, status: "approved" })}>Setujui</Button>
                      <ConfirmDialog title="Tolak Withdrawal?" message={`Yakin ingin menolak withdrawal ${formatIDR(w.amount_idr)}?`} confirmLabel="Tolak" variant="destructive" onConfirm={() => update.mutate({ id: w.id, status: "rejected" })}>
                        {(open) => <Button size="sm" variant="destructive" onClick={open}>Tolak</Button>}
                      </ConfirmDialog>
                    </>}
                    {w.status === "approved" && <Button size="sm" onClick={() => update.mutate({ id: w.id, status: "processed" })}>Tandai Diproses</Button>}
                  </div>
                </>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada withdrawal.</p>}
        </div>
      </AdminList>
    </div>
  );
}
