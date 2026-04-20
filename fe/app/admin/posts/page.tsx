"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useTranslation } from "@/lib/use-translation";
import { useAdminList } from "@/lib/use-admin-list";
import { AdminList } from "@/components/admin-list";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink } from "lucide-react";
import { formatIDR, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function AdminPosts() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const list = useAdminList("admin-posts", "/admin/posts");
  const del = useMutation({ mutationFn: (id: string) => api.delete(`/admin/posts/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-posts"] }) });

  const sorts = [
    { label: t("admin_common.title"), key: "title" },
    { label: t("admin_common.views"), key: "view_count" },
    { label: t("admin_common.likes"), key: "like_count" },
    { label: t("admin_common.comments"), key: "comment_count" },
    { label: t("admin_common.date"), key: "created_at" }
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t("admin_posts.title")}</h1>
      <AdminList
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t("admin_posts.search_placeholder")}
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-2">
          {list.items.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <div className="flex gap-2 mt-1"><Badge>{p.status}</Badge><Badge>{p.access_type}</Badge>{p.price && <span className="text-sm">{formatIDR(p.price)}</span>}</div>
                  <p className="text-xs text-gray-400 mt-1">{t("admin_posts.by")}{p.creator?.username || "?"} · 👁 {p.view_count} · ❤️ {p.like_count} · 💬 {p.comment_count} · {formatDate(p.created_at)}</p>
                </div>
                <div className="flex gap-1">
                  <Link href={`/posts/${p.id}`}><Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button></Link>
                  <ConfirmDialog title={t("admin_posts.delete_confirm_title")} message={t("admin_posts.delete_confirm_message", p.title)} confirmLabel={t("admin_posts.delete")} variant="destructive" onConfirm={() => del.mutate(p.id)}>
                    {(open) => <Button variant="ghost" size="icon" onClick={open}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                  </ConfirmDialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("admin_posts.no_data")}</p>}
        </div>
      </AdminList>
    </div>
  );
}
