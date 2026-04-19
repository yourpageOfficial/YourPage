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
import Link from "next/link";
import { ExternalLink, Ban, Trash2 } from "lucide-react";

function targetLink(r: any): string {
  switch (r.target_type) {
    case "post": return `/posts/${r.target_id}`;
    case "product": return `/products/${r.target_id}`;
    case "user": return `/admin/users/${r.target_id}`;
    default: return "#";
  }
}

export default function AdminReports() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const list = useAdminList("admin-reports", "/admin/reports");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/reports/${id}`, { status, admin_note: notes[id] || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  const banUser = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/ban`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  const deletePost = useMutation({
    mutationFn: (postId: string) => api.delete(`/admin/posts/${postId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  const deleteProduct = useMutation({
    mutationFn: (productId: string) => api.delete(`/admin/products/${productId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  const handleAction = (r: any, action: string) => {
    if (action === "ban" && r.target_type === "user") {
      banUser.mutate(r.target_id);
    } else if (action === "delete" && r.target_type === "post") {
      deletePost.mutate(r.target_id);
    } else if (action === "delete" && r.target_type === "product") {
      deleteProduct.mutate(r.target_id);
    }
  };

  const filters = [
    { label: t("admin_reports.status_pending"), value: "pending" },
    { label: t("admin_reports.status_resolved"), value: "resolved" },
    { label: t("admin_reports.status_dismissed"), value: "dismissed" }
  ];
  const sorts = [
    { label: t("admin_common.reason"), key: "reason" },
    { label: t("admin_common.type"), key: "target_type" },
    { label: t("admin_common.date"), key: "created_at" },
    { label: t("admin_common.status"), key: "status" }
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t("admin_reports.title")}</h1>
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t("admin_reports.search_placeholder")}
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-3">
          {list.items.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">{r.reason}</Badge>
                    <Badge variant="outline">{r.target_type}</Badge>
                  </div>
                  <Badge className={statusColor[r.status] || ""}>{statusLabel[r.status] || r.status}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">{t("admin_reports.target")}:</span>
                    <Link href={targetLink(r)} className="text-primary hover:underline flex items-center gap-1">
                      {r.target_id?.slice(0, 8)}... <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("admin_reports.reporter")}:</span> {r.reporter_id?.slice(0, 8) || t("admin_reports.anonymous")}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("admin_reports.date")}:</span> {formatDate(r.created_at)}</div>
                </div>

                {r.description && <p className="text-sm bg-primary-50 dark:bg-primary-900/20 p-2 rounded">{r.description}</p>}
                {r.admin_note && <p className="text-sm bg-primary-50/50 dark:bg-navy-800 p-2 rounded">Note: {r.admin_note}</p>}

                {r.status === "pending" && (
                  <div className="space-y-2 pt-1">
                    <Input placeholder={t("admin_reports.note")} value={notes[r.id] || ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => update.mutate({ id: r.id, status: "resolved" })}>✅ {t("admin_reports.resolve")}</Button>
                      <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: r.id, status: "dismissed" })}>{t("admin_reports.dismiss")}</Button>

                      <div className="border-l pl-2 ml-1 flex gap-2">
                        <Link href={targetLink(r)}>
                          <Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3 w-3" /> {t("admin_reports.view")}</Button>
                        </Link>
                        {r.target_type === "user" && (
                          <ConfirmDialog title={t("admin_reports.ban_confirm_title")} message={t("admin_reports.ban_confirm_message")} confirmLabel={t("admin_reports.ban_user")} variant="destructive" onConfirm={() => handleAction(r, "ban")}>
                            {(open) => <Button size="sm" variant="destructive" onClick={open}><Ban className="mr-1 h-3 w-3" /> {t("admin_reports.ban_user")}</Button>}
                          </ConfirmDialog>
                        )}
                        {(r.target_type === "post" || r.target_type === "product") && (
                          <ConfirmDialog title={r.target_type === "post" ? t("admin_reports.delete_confirm_title") : t("admin_reports.delete_confirm_title")} message={t("admin_reports.delete_confirm_message")} confirmLabel={r.target_type === "post" ? t("admin_reports.delete_post") : t("admin_reports.delete_product")} variant="destructive" onConfirm={() => handleAction(r, "delete")}>
                            {(open) => <Button size="sm" variant="destructive" onClick={open}><Trash2 className="mr-1 h-3 w-3" /> {r.target_type === "post" ? t("admin_reports.delete_post") : t("admin_reports.delete_product")}</Button>}
                          </ConfirmDialog>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("admin_reports.no_data")}</p>}
        </div>
      </AdminList>
    </div>
  );
}
