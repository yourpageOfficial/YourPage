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
import { useTranslation } from "@/lib/internationalization";

export default function AdminKYC() {
  const { t, interpolate } = useTranslation();
  const qc = useQueryClient();
  const list = useAdminList("admin-kyc", "/admin/kyc");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/kyc/${id}`, { status, admin_note: notes[id] || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-kyc"] }),
  });

  const filters = [{ label: t.adminModeration.filterPending, value: "pending" }, { label: t.adminModeration.filterApproved, value: "approved" }, { label: t.adminModeration.filterRejected, value: "rejected" }];
  const sorts = [{ label: t.adminModeration.sortName, key: "full_name" }, { label: t.adminModeration.sortDate, key: "created_at" }, { label: t.adminModeration.sortStatus, key: "status" }];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t.adminModeration.kycTitle}</h1>
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t.adminModeration.searchKyc}
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
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminModeration.kycUser}</span> {k.user?.username || k.user_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t.adminModeration.kycSubmitted}</span> {formatDate(k.created_at)}</div>
                  {k.reviewed_at && <div><span className="text-gray-500 dark:text-gray-400">{t.adminModeration.kycReviewed}</span> {formatDate(k.reviewed_at)}</div>}
                </div>
                {/* The reviewer previously had no document to look at and
                    approved blind. This link is signed and short-lived. */}
                {k.ktp_image_url ? (
                  <a href={k.ktp_image_url} target="_blank" rel="noopener noreferrer" className="block">
                    <img loading="lazy" src={k.ktp_image_url} alt={interpolate(t.adminModeration.kycDocAlt, { name: k.full_name })} className="max-h-56 rounded-xl border object-contain dark:border-navy-800" />
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{t.adminModeration.kycDocClickHint}</span>
                  </a>
                ) : (
                  <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    {t.adminModeration.kycDocUnavailable}
                  </p>
                )}
                {k.admin_note && <p className="text-sm bg-primary-50/50 dark:bg-navy-800 p-2 rounded">{t.adminModeration.kycNoteLabel} {k.admin_note}</p>}
                {k.status === "pending" && <>
                  <Input placeholder={t.adminModeration.kycNotePlaceholder} value={notes[k.id] || ""} onChange={(e) => setNotes({ ...notes, [k.id]: e.target.value })} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => update.mutate({ id: k.id, status: "approved" })}>{t.adminModeration.approve}</Button>
                    <ConfirmDialog title={t.adminModeration.kycRejectTitle} message={interpolate(t.adminModeration.kycRejectMessage, { name: k.full_name })} confirmLabel={t.adminModeration.reject} variant="destructive" onConfirm={() => update.mutate({ id: k.id, status: "rejected" })}>
                      {(open) => <Button size="sm" variant="destructive" onClick={open}>{t.adminModeration.reject}</Button>}
                    </ConfirmDialog>
                  </div>
                </>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t.adminModeration.emptyKyc}</p>}
        </div>
      </AdminList>
    </div>
  );
}
