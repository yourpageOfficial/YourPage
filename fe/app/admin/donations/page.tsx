"use client";

import { useAdminList } from "@/lib/use-admin-list";
import { statusColor, statusLabel } from "@/components/ui/standards";
import { AdminList } from "@/components/admin-list";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";

const filters = [{ label: "Menunggu", value: "pending" }, { label: "Dibayar", value: "paid" }, { label: "Gagal", value: "failed" }];
const sorts = [{ label: "Amount", key: "amount_idr" }, { label: "Donor", key: "donor_name" }, { label: "Date", key: "created_at" }, { label: "Status", key: "status" }];

export default function AdminDonations() {
  const list = useAdminList("admin-donations", "/admin/donations");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">Donasi</h1>
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder="Cari donor, creator..."
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-2">
          {list.items.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">{formatIDR(d.amount_idr)}</p>
                  <Badge className={statusColor[d.status] || ""}>{statusLabel[d.status] || d.status}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Dari:</span> {d.is_anonymous ? "Anonim" : (d.supporter?.username || d.donor_name)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Ke:</span> {d.creator?.username || d.creator_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Net:</span> {formatIDR(d.net_amount_idr)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Payment:</span> {d.payment_id?.slice(0, 8)}...</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Tanggal:</span> {formatDate(d.created_at)}</div>
                </div>
                {d.message && <p className="text-sm bg-primary-50 dark:bg-primary-900/20 p-2 rounded mt-1">&ldquo;{d.message}&rdquo;</p>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada donasi.</p>}
        </div>
      </AdminList>
    </div>
  );
}
