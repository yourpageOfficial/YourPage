"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatDate } from "@/lib/utils";
import { Trash2, Plus, Upload, Image } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Post, PaginatedResponse } from "@/lib/types";

export default function DashboardPosts() {
  const t = useTranslations("Posts");
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [accessType, setAccessType] = useState<"free" | "paid">("free");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data; } catch { return {}; } },
  });
  const isPro = earnings?.tier_name === "Pro" || earnings?.tier_name === "Business";

  const { data: posts } = useQuery({
    queryKey: ["my-posts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Post>>(`/posts/creator/${user!.id}`);
      return data.data;
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/posts", {
        title,
        content,
        access_type: accessType,
        price: accessType === "paid" ? parseInt(price) * 1000 : undefined,
        status: scheduledAt ? "draft" : "published",
        scheduled_at: scheduledAt || undefined,
      });
      const postId = data.data.id;

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const formData = new FormData();
        formData.append("file", f);
        formData.append("media_type", getMediaType(f.type));
        formData.append("sort_order", String(i));
        await api.post(`/posts/${postId}/media`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-posts"] });
      setShowForm(false);
      setTitle(""); setContent(""); setPrice(""); setFiles([]);
      toast.success(t("create_success"));
    },
    onError: (err: any) => toast.error(err.response?.data?.error || t("create_failed")),
  });

  const deletePost = useMutation({
    mutationFn: (id: string) => api.delete(`/posts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-posts"] }); toast.success(t("delete_success")); },
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> {t("create")}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="space-y-3 p-4">
            <Input placeholder={t("title_placeholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder={t("content_placeholder")} value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[120px]" />

            <div>
              <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.zip" className="hidden" onChange={handleFiles} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> {t("upload_media")}
              </Button>
              {files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 rounded bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs">
                      <Image className="h-3 w-3" />
                      <span className="max-w-[120px] truncate">{f.name}</span>
                      <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-500 ml-1">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant={accessType === "free" ? "default" : "outline"} onClick={() => setAccessType("free")}>{t("free")}</Button>
              <Button size="sm" variant={accessType === "paid" ? "default" : "outline"} onClick={() => setAccessType("paid")}>{t("paid")}</Button>
              {accessType === "paid" && (
                <Input type="number" placeholder={t("price_credit")} value={price} onChange={(e) => setPrice(e.target.value)} className="w-40" />
              )}
            </div>
            {isPro && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">{t("schedule_optional")}</label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-60" />
              </div>
            )}
            <Button onClick={() => createPost.mutate()} disabled={createPost.isPending || !title}>
              {createPost.isPending ? t("schedule") : scheduledAt ? t("schedule") : t("publish")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {posts?.map((post) => (
          <Card key={post.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => window.location.href = `/dashboard/posts/${post.id}`}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{post.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge>{post.status}</Badge>
                  {post.scheduled_at && post.status === "draft" && (
                    <Badge variant="outline" className="text-xs">🕐 {new Date(post.scheduled_at).toLocaleDateString("id-ID")}</Badge>
                  )}
                  <Badge className={post.access_type === "paid" ? "bg-secondary-100 text-secondary-600" : ""}>
                    {post.access_type === "paid" ? formatCredit(post.price || 0) : t("free")}
                  </Badge>
                  {post.media?.length > 0 && <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{post.media.length} media</Badge>}
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(post.created_at)}</span>
                </div>
              </div>
              <ConfirmDialog title={t("delete_title")} message={t("delete_message")} onConfirm={() => deletePost.mutate(post.id)}>
                {(open) => (
                  <Button variant="ghost" size="icon" onClick={open}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                )}
              </ConfirmDialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getMediaType(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}
