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
import { useBulkSelect } from "@/lib/use-bulk-select";
import { toast } from "@/lib/toast";
import { formatIDR, formatDate } from "@/lib/utils";

const filters = [{ label: "Menunggu", value: "pending" }, { label: "Dibayar", value: "paid" }, { label: "Gagal", value: "failed" }];
const sorts = [{ label: "Amount", key: "amount_idr" }, { label: "Credits", key: "credits" }, { label: "Donor", key: "donor_name" }, { label: "Date", key: "created_at" }, { label: "Status", key: "status" }];

export default function AdminTopups() {
  const qc = useQueryClient();
  const list = useAdminList("admin-topups", "/admin/credit-topups");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const bulk = useBulkSelect();
  const pendingIds = list.items.filter((t: any) => t.status === "pending").map((t: any) => t.id);

  const bulkApprove = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.post(`/admin/credit-topups/${id}/approve`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topups"] }); toast.success(`${bulk.count} topup approved`); bulk.clear(); },
  });
  const bulkReject = useMutation({
    mutationFn: async () => { for (const id of Array.from(bulk.selected)) await api.post(`/admin/credit-topups/${id}/reject`, { admin_note: "Bulk rejected" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topups"] }); toast.success(`${bulk.count} topup rejected`); bulk.clear(); },
  });
  const approve = useMutation({ mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/approve`, { admin_note: notes[id] }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topups"] }) });
  const reject = useMutation({ mutationFn: (id: string) => api.post(`/admin/credit-topups/${id}/reject`, { admin_note: notes[id] || "Ditolak" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topups"] }) });

  return (
    <div>
      <h1 className="mb-6 text-xl sm:text-2xl font-bold">Top-up Credit</h1>
      {bulk.count > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
          <span className="text-sm font-medium">{bulk.count} dipilih</span>
          <Button size="sm" onClick={() => bulkApprove.mutate()} disabled={bulkApprove.isPending}>✅ Setujui Semua</Button>
          <Button size="sm" variant="destructive" onClick={() => bulkReject.mutate()} disabled={bulkReject.isPending}>❌ Tolak Semua</Button>
          <Button size="sm" variant="ghost" onClick={bulk.clear}>Batal</Button>
        </div>
      )}
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder="Cari nama donor, user ID..."
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
          {list.items.map((t: any) => (
            <Card key={t.id} className={bulk.selected.has(t.id) ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {t.status === "pending" && <input type="checkbox" checked={bulk.selected.has(t.id)} onChange={() => bulk.toggle(t.id)} className="rounded" />}
                    <p className="text-xl font-bold">{formatIDR(t.amount_idr)} → {t.credits} credit</p>
                  </div>
                  <Badge className={statusColor[t.status] || ""}>{statusLabel[t.status] || t.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Donor:</span> {t.donor_name}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">User:</span> {t.user?.username || t.user_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Kode Unik:</span> <span className="font-bold text-primary">{t.unique_code || "-"}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Tanggal:</span> {formatDate(t.created_at)}</div>
                </div>
                {t.proof_image_url && <a href={t.proof_image_url} target="_blank"><img src={t.proof_image_url} alt="bukti" className="max-h-48 rounded border object-contain" /></a>}
                {t.admin_note && <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">Note: {t.admin_note}</p>}
                {t.status === "pending" && <>
                  <Input placeholder="Catatan (opsional)" value={notes[t.id] || ""} onChange={(e) => setNotes({ ...notes, [t.id]: e.target.value })} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve.mutate(t.id)}>Setujui</Button>
                    <Button size="sm" variant="destructive" onClick={() => reject.mutate(t.id)}>Tolak</Button>
                  </div>
                </>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada topup.</p>}
        </div>
      </AdminList>
    </div>
  );
}
