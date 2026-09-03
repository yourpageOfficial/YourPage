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
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ExternalLink, Ban, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

function targetLink(r: any): string {
  switch (r.target_type) {
    case "post": return `/posts/${r.target_id}`;
    case "product": return `/products/${r.target_id}`;
    case "user": return `/admin/users/${r.target_id}`;
    default: return "#";
  }
}

export default function AdminReports() {
  const { t, interpolate } = useTranslation();
  const qc = useQueryClient();
  const list = useAdminList("admin-reports", "/admin/reports");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const filters = [{ label: t.adminModeration.filterPending, value: "pending" }, { label: t.adminModeration.filterResolved, value: "resolved" }, { label: t.adminModeration.filterDismissed, value: "dismissed" }];
  const sorts = [{ label: t.adminModeration.sortReason, key: "reason" }, { label: t.adminModeration.sortType, key: "target_type" }, { label: t.adminModeration.sortDate, key: "created_at" }, { label: t.adminModeration.sortStatus, key: "status" }];

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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t.adminModeration.reportsTitle}</h1>
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t.adminModeration.searchReports}
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-3">
          {list.items.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">{r.reason}</Badge>
                    <Badge variant="outline">{r.target_type}</Badge>
                  </div>
                  <Badge className={statusColor[r.status] || ""}>{statusLabel[r.status] || r.status}</Badge>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">{t.adminModeration.reportTarget}</span>
                    <Link href={targetLink(r)} className="text-primary hover:underline flex items-center gap-1">
                      {r.target_id?.slice(0, 8)}... <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminModeration.reportReporter}</span> {r.reporter_id?.slice(0, 8) || t.adminModeration.donationAnonymous}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminModeration.reportDate}</span> {formatDate(r.created_at)}</div>
                </div>

                {r.description && <p className="text-sm bg-primary-50 dark:bg-primary-900/20 p-2 rounded">{r.description}</p>}
                {r.admin_note && <p className="text-sm bg-primary-50/50 dark:bg-navy-800 p-2 rounded">{t.adminModeration.kycNoteLabel} {r.admin_note}</p>}

                {/* Actions */}
                {r.status === "pending" && (
                  <div className="space-y-2 pt-1">
                    <Input placeholder={t.adminModeration.reportNotePlaceholder} value={notes[r.id] || ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />

                    {/* Resolve / Dismiss */}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => update.mutate({ id: r.id, status: "resolved" })}>✅ {t.adminModeration.reportResolve}</Button>
                      <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: r.id, status: "dismissed" })}>{t.adminModeration.reportDismiss}</Button>

                      {/* Direct actions on target */}
                      <div className="border-l pl-2 ml-1 flex gap-2">
                        <Link href={targetLink(r)}>
                          <Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3 w-3" /> {t.adminModeration.view}</Button>
                        </Link>
                        {r.target_type === "user" && (
                          <ConfirmDialog title={t.adminModeration.reportBanTitle} message={t.adminModeration.reportBanMessage} confirmLabel={t.adminModeration.ban} variant="destructive" onConfirm={() => handleAction(r, "ban")}>
                            {(open) => <Button size="sm" variant="destructive" onClick={open}><Ban className="mr-1 h-3 w-3" /> {t.adminModeration.reportBanUser}</Button>}
                          </ConfirmDialog>
                        )}
                        {(r.target_type === "post" || r.target_type === "product") && (
                          <ConfirmDialog title={interpolate(t.adminModeration.reportDeleteTitle, { type: r.target_type === "post" ? "Post" : "Product" })} message={t.adminModeration.reportDeleteMessage} confirmLabel={t.adminModeration.delete} variant="destructive" onConfirm={() => handleAction(r, "delete")}>
                            {(open) => <Button size="sm" variant="destructive" onClick={open}><Trash2 className="mr-1 h-3 w-3" /> {t.adminModeration.delete} {r.target_type === "post" ? "Post" : "Product"}</Button>}
                          </ConfirmDialog>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t.adminModeration.emptyReports}</p>}
        </div>
      </AdminList>
    </div>
  );
}
