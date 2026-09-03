"use client";

import { useAdminList } from "@/lib/use-admin-list";
import { statusColor, statusLabel } from "@/components/ui/standards";
import { AdminList } from "@/components/admin-list";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/internationalization";

export default function AdminDonations() {
  const { t } = useTranslation();
  const list = useAdminList("admin-donations", "/admin/donations");

  const filters = [{ label: t.adminModeration.filterPending, value: "pending" }, { label: t.adminModeration.filterPaid, value: "paid" }, { label: t.adminModeration.filterFailed, value: "failed" }];
  const sorts = [{ label: t.adminModeration.sortAmount, key: "amount_idr" }, { label: t.adminModeration.sortDonor, key: "donor_name" }, { label: t.adminModeration.sortDate, key: "created_at" }, { label: t.adminModeration.sortStatus, key: "status" }];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t.adminModeration.donationsTitle}</h1>
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t.adminModeration.searchDonations}
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
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminModeration.donationFrom}</span> {d.is_anonymous ? t.adminModeration.donationAnonymous : (d.supporter?.username || d.donor_name)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminModeration.donationTo}</span> {d.creator?.username || d.creator_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminModeration.donationNet}</span> {formatIDR(d.net_amount_idr)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminModeration.donationPayment}</span> {d.payment_id?.slice(0, 8)}...</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminModeration.donationDate}</span> {formatDate(d.created_at)}</div>
                </div>
                {d.message && <p className="text-sm bg-primary-50 dark:bg-primary-900/20 p-2 rounded mt-1">&ldquo;{d.message}&rdquo;</p>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t.adminModeration.emptyDonations}</p>}
        </div>
      </AdminList>
    </div>
  );
}
