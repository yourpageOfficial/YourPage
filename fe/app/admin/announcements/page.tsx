"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Trash2, Plus } from "lucide-react";
import type { PlatformAnnouncement, ApiResponse } from "@/lib/types";
import { useTranslation } from "@/lib/internationalization";

export default function AdminAnnouncementsPage() {
  const { t, locale } = useTranslation();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PlatformAnnouncement[]>>("/admin/announcements");
      return data.data ?? [];
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/announcements/${id}`),
    onSuccess: () => { toast.success(t.adminModeration.announcementsDeleted); qc.invalidateQueries({ queryKey: ["admin-announcements"] }); },
    onError: () => toast.error(t.adminModeration.announcementsDeleteFailed),
  });

  const ROLE_LABELS: Record<string, string> = {
    all: t.adminModeration.announcementsAllUsers,
    creator: t.adminModeration.announcementsOnlyCreator,
    supporter: t.adminModeration.announcementsOnlySupporter,
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { toast.error(t.adminModeration.announcementsValidation); return; }
    setCreating(true);
    try {
      await api.post("/admin/announcements", {
        title: title.trim(),
        body: body.trim(),
        target_role: targetRole,
        expires_at: expiresAt || undefined,
      });
      toast.success(t.adminModeration.announcementsCreated);
      setTitle(""); setBody(""); setExpiresAt("");
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    } catch { toast.error(t.adminModeration.announcementsCreateFailed); }
    finally { setCreating(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Megaphone className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-display font-black">{t.adminModeration.announcementsTitle}</h1>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> {t.adminModeration.announcementsCreateTitle}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input placeholder={t.adminModeration.announcementsTitlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
            <textarea
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm bg-transparent resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={t.adminModeration.announcementsBodyPlaceholder}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <div className="flex gap-3 flex-wrap">
              <select
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="all">{ROLE_LABELS.all}</option>
                <option value="creator">{ROLE_LABELS.creator}</option>
                <option value="supporter">{ROLE_LABELS.supporter}</option>
              </select>
              <Input
                type="datetime-local"
                className="w-auto"
                placeholder={t.adminModeration.announcementsExpiryPlaceholder}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <Button type="submit" loading={creating}>{t.adminModeration.announcementsPublish}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-400 text-sm text-center py-6">{t.adminModeration.announcementsEmpty}</p>}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-sm">{item.title}</p>
                    <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                      {item.is_active ? t.adminModeration.announcementsActive : t.adminModeration.announcementsInactive}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABELS[item.target_role] ?? item.target_role}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{item.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(item.created_at).toLocaleString(locale === "id" ? "id-ID" : "en-US")}
                    {item.expires_at && ` · ${t.adminModeration.announcementsExpiresLabel} ${new Date(item.expires_at).toLocaleString(locale === "id" ? "id-ID" : "en-US")}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 shrink-0"
                  onClick={() => deleteMut.mutate(item.id)}
                  loading={deleteMut.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
