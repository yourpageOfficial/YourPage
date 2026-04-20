"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { useTranslation } from "@/lib/use-translation";
import { useAdminList } from "@/lib/use-admin-list";
import { AdminList } from "@/components/admin-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const roleBadge: Record<string, string> = { admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400", creator: "bg-primary-100 dark:bg-primary-900/30 text-blue-700 dark:text-blue-400", supporter: "bg-primary-50 dark:bg-navy-800 text-gray-700 dark:text-gray-400" };

export default function AdminUsers() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const list = useAdminList("admin-users", "/admin/users", { filterParam: "role" });
  const verify = useMutation({ mutationFn: (id: string) => api.post(`/admin/users/${id}/verify`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("admin_users.verified")); } });
  const ban = useMutation({ mutationFn: (id: string) => api.post(`/admin/users/${id}/ban`), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }) });
  const unban = useMutation({ mutationFn: (id: string) => api.post(`/admin/users/${id}/unban`), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }) });

  const [showFinance, setShowFinance] = useState(false);
  const [fEmail, setFEmail] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fName, setFName] = useState("");
  const createFinance = useMutation({
    mutationFn: () => api.post("/admin/users/finance", { email: fEmail, password: fPassword, display_name: fName }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("admin_users.finance_user") + " " + t("common.success").toLowerCase()); setShowFinance(false); setFEmail(""); setFPassword(""); setFName(""); },
    onError: (e: any) => toast.error(e.response?.data?.error || t("common.error")),
  });

  const filters = [
    { label: t("admin_common.creator"), value: "creator" },
    { label: t("admin_common.supporter"), value: "supporter" },
    { label: t("admin_common.admin"), value: "admin" }
  ];
  const sorts = [
    { label: "Username", key: "username" },
    { label: t("admin_common.display_name"), key: "display_name" },
    { label: t("admin_common.role"), key: "role" },
    { label: t("admin_common.date"), key: "created_at" }
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: t("admin.users") }]} className="mb-4" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-black tracking-tight">{t("admin_users.title")}</h1>
        <Button size="sm" variant="outline" onClick={() => setShowFinance(!showFinance)}>+ {t("admin_users.add_finance_user")}</Button>
      </div>
      {showFinance && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">{t("admin_users.add_finance_user")}</p>
            <Input placeholder={t("auth.email")} value={fEmail} onChange={e => setFEmail(e.target.value)} />
            <Input placeholder={t("admin_common.display_name")} value={fName} onChange={e => setFName(e.target.value)} />
            <Input type="password" placeholder={`${t("auth.password")} (min 8)`} value={fPassword} onChange={e => setFPassword(e.target.value)} />
            <Button size="sm" onClick={() => createFinance.mutate()} disabled={!fEmail || !fPassword || fPassword.length < 8 || !fName}>{t("admin_users.create_finance_user")}</Button>
          </CardContent>
        </Card>
      )}
      <AdminList
        filters={filters} activeFilter={list.filter} onFilter={list.setFilter}
        search={list.search} onSearch={list.setSearch} searchPlaceholder={t("admin_users.search_placeholder")}
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-2">
          {list.items.map((u: any) => (
            <Card key={u.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => window.location.href = `/admin/users/${u.id}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={u.avatar_url} name={u.display_name} size="md" />
                  <div>
                    <p className="font-medium">{u.display_name} <span className="text-gray-400 text-sm">@{u.username}</span></p>
                    <p className="text-xs text-gray-400 dark:text-gray-400">{formatDate(u.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={roleBadge[u.role] || ""}>{u.role}</Badge>
                  {u.is_banned && <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{t("admin_users.banned")}</Badge>}
                  {u.role === "creator" && <Link href={`/c/${u.username}`} onClick={e => e.stopPropagation()}><Button size="sm" variant="outline">{t("admin_users.page")}</Button></Link>}
                  {u.role === "creator" && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); verify.mutate(u.id); }}>✓ {t("admin_users.verified")}</Button>}
                  {u.role === "creator" && <Link href={`/admin/users/${u.id}`} onClick={e => e.stopPropagation()}><Button size="sm" variant="outline">🎯 {t("admin_users.promo")}</Button></Link>}
                  {u.is_banned ? <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); unban.mutate(u.id); }}>{t("admin_users.unban")}</Button>
                    : u.role !== "admin" && (
                      <ConfirmDialog title={t("admin_users.ban_confirm_title")} message={t("admin_users.ban_confirm_message", u.display_name)} confirmLabel={t("admin_users.ban")} variant="destructive" onConfirm={() => ban.mutate(u.id)}>
                        {(open) => <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); open(); }}>{t("admin_users.ban")}</Button>}
                      </ConfirmDialog>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("admin_users.no_data")}</p>}
        </div>
      </AdminList>
    </div>
  );
}
