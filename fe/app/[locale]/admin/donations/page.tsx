"use client";

import { useTranslations } from "next-intl";
import { useAdminList } from "@/lib/use-admin-list";
import { statusColor } from "@/components/ui/standards";
import { AdminList } from "@/components/admin-list";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";

export default function AdminDonations() {
  const t = useTranslations("AdminDonations");

  const filters = [{ label: t("pending"), value: "pending" }, { label: t("paid"), value: "paid" }, { label: t("failed"), value: "failed" }];
  const sorts = [{ label: t("amount"), key: "amount_idr" }, { label: t("donor"), key: "donor_name" }, { label: t("date"), key: "created_at" }, { label: t("status"), key: "status" }];

  const list = useAdminList("admin-donations", "/admin/donations");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t("search_placeholder")}
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
                  <Badge className={statusColor[d.status] || ""}>{d.status}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">{t("from_label")}</span> {d.is_anonymous ? t("anonymous") : (d.supporter?.username || d.donor_name)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("to_label")}</span> {d.creator?.username || d.creator_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("net_label")}</span> {formatIDR(d.net_amount_idr)}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("payment_label")}</span> {d.payment_id?.slice(0, 8)}...</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("date_label")}</span> {formatDate(d.created_at)}</div>
                </div>
                {d.message && <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded mt-1">&ldquo;{d.message}&rdquo;</p>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>}
        </div>
      </AdminList>
    </div>
  );
}
