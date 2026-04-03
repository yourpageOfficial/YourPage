"use client";

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
import { formatIDR, formatDate } from "@/lib/utils";
import { Trash2, Plus, Upload, Image } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Post, PaginatedResponse } from "@/lib/types";

export default function DashboardPosts() {
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
      // 1. Create post
      const { data } = await api.post("/posts", {
        title,
        content,
        access_type: accessType,
        price: accessType === "paid" ? parseInt(price) * 1000 : undefined,
        status: scheduledAt ? "draft" : "published",
        scheduled_at: scheduledAt || undefined,
      });
      const postId = data.data.id;

      // 2. Upload media files
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
      toast.success("Post berhasil dipublikasikan!");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal membuat post"),
  });

  const deletePost = useMutation({
    mutationFn: (id: string) => api.delete(`/posts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-posts"] }); toast.success("Post dihapus"); },
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Buat Post
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="space-y-3 p-4">
            <Input placeholder="Judul" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Konten..." value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[120px]" />

            {/* Media upload */}
            <div>
              <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.zip" className="hidden" onChange={handleFiles} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> Upload Media
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
              <Button size="sm" variant={accessType === "free" ? "default" : "outline"} onClick={() => setAccessType("free")}>Gratis</Button>
              <Button size="sm" variant={accessType === "paid" ? "default" : "outline"} onClick={() => setAccessType("paid")}>Berbayar</Button>
              {accessType === "paid" && (
                <Input type="number" placeholder="Harga (Credit)" value={price} onChange={(e) => setPrice(e.target.value)} className="w-40" />
              )}
            </div>
            {isPro && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Jadwalkan (opsional)</label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-60" />
              </div>
            )}
            <Button onClick={() => createPost.mutate()} disabled={createPost.isPending || !title}>
              {createPost.isPending ? "Menyimpan..." : scheduledAt ? "Jadwalkan" : "Publish"}
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
                    {post.access_type === "paid" ? formatIDR(post.price || 0) : "Gratis"}
                  </Badge>
                  {post.media?.length > 0 && <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{post.media.length} media</Badge>}
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(post.created_at)}</span>
                </div>
              </div>
              <ConfirmDialog title="Hapus Post?" message="Post yang dihapus tidak bisa dikembalikan." onConfirm={() => deletePost.mutate(post.id)}>
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
