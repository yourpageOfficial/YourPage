"use client";

import { useState } from "react";
import { statusColor } from "@/components/ui/standards";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { useAdminList } from "@/lib/use-admin-list";
import { AdminList } from "@/components/admin-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function AdminKYC() {
  const t = useTranslations("AdminKyc");

  const filters = [{ label: t("pending"), value: "pending" }, { label: t("approved"), value: "approved" }, { label: t("rejected"), value: "rejected" }];
  const sorts = [{ label: t("name"), key: "full_name" }, { label: t("date"), key: "created_at" }, { label: t("status"), key: "status" }];

  const qc = useQueryClient();
  const list = useAdminList("admin-kyc", "/admin/kyc");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/kyc/${id}`, { status, admin_note: notes[id] || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-kyc"] }),
  });

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
        <div className="space-y-3">
          {list.items.map((k: any) => (
            <Card key={k.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium">{k.full_name}</p>
                  <Badge className={statusColor[k.status] || ""}>{k.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">{t("user_label")}</span> {k.user?.username || k.user_id?.slice(0, 8) + "..."}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t("submitted_label")}</span> {formatDate(k.created_at)}</div>
                  {k.reviewed_at && <div><span className="text-gray-500 dark:text-gray-400">{t("reviewed_label")}</span> {formatDate(k.reviewed_at)}</div>}
                </div>
                {k.admin_note && <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">{t("note_label")} {k.admin_note}</p>}
                {k.status === "pending" && <>
                  <Input placeholder={t("note_placeholder")} value={notes[k.id] || ""} onChange={(e) => setNotes({ ...notes, [k.id]: e.target.value })} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => update.mutate({ id: k.id, status: "approved" })}>{t("approve")}</Button>
                    <Button size="sm" variant="destructive" onClick={() => update.mutate({ id: k.id, status: "rejected" })}>{t("reject")}</Button>
                  </div>
                </>}
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>}
        </div>
      </AdminList>
    </div>
  );
}
