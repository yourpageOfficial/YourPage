"use client";

import { useState } from "react";
import { statusColor, statusLabel } from "@/components/ui/standards";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useTranslation } from "@/lib/use-translation";
import { useAdminList } from "@/lib/use-admin-list";
import { AdminList } from "@/components/admin-list";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function AdminKYC() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const list = useAdminList("admin-kyc", "/admin/kyc");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/kyc/${id}`, { status, admin_note: notes[id] || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-kyc"] }),
  });

  const filters = [
    { label: t("admin_kyc.status_pending"), value: "pending" },
    { label: t("admin_kyc.status_approved"), value: "approved" },
    { label: t("admin_kyc.status_rejected"), value: "rejected" }
  ];
  const sorts = [
    { label: t("admin_common.name"), key: "full_name" },
    { label: t("admin_common.date"), key: "created_at" },
    { label: t("admin_common.status"), key: "status" }
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t("admin_kyc.title")}</h1>
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t("admin_kyc.search_placeholder")}
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-3">
          {list.items.map((k: any) => (
            <Card key={k.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium">{k.full_name}</p>
                  <Badge className={statusColor[k.status] || ""}>{statusLabel[k.status] || k.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">{t("admin_kyc.user")}:</span> {k.user?.username || k.user_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("admin_kyc.submitted")}:</span> {formatDate(k.created_at)}</div>
                  {k.reviewed_at && <div><span className="text-gray-500 dark:text-gray-400">{t("admin_kyc.reviewed")}:</span> {formatDate(k.reviewed_at)}</div>}
                </div>
                {k.admin_note && <p className="text-sm bg-primary-50/50 dark:bg-navy-800 p-2 rounded">Note: {k.admin_note}</p>}
                {k.status === "pending" && <>
                  <Input placeholder={t("admin_kyc.note")} value={notes[k.id] || ""} onChange={(e) => setNotes({ ...notes, [k.id]: e.target.value })} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => update.mutate({ id: k.id, status: "approved" })}>{t("admin_kyc.approve")}</Button>
                    <ConfirmDialog title={t("admin_kyc.reject_confirm_title")} message={t("admin_kyc.reject_confirm_message", k.full_name)} confirmLabel={t("admin_kyc.reject")} variant="destructive" onConfirm={() => update.mutate({ id: k.id, status: "rejected" })}>
                      {(open) => <Button size="sm" variant="destructive" onClick={open}>{t("admin_kyc.reject")}</Button>}
                    </ConfirmDialog>
                  </div>
                </>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("admin_kyc.no_data")}</p>}
        </div>
      </AdminList>
    </div>
  );
}
