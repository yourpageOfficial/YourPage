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
import { formatCredit, formatDate } from "@/lib/utils";
import { Trash2, Plus, Upload, Image, FileText, Clock, Eye, X, ChevronDown } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Post, MembershipTier, PaginatedResponse } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { staggerChildren, staggerItem } from "@/lib/motion-variants";

export default function DashboardPosts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [accessType, setAccessType] = useState<"free" | "paid" | "members">("free");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [memberTierID, setMemberTierID] = useState("");

  const { data: membershipTiers } = useQuery({
    queryKey: ["my-membership-tiers"],
    queryFn: async () => { const { data } = await api.get(`/membership-tiers/${user!.id}`); return (data.data || []) as MembershipTier[]; },
    enabled: !!user,
  });

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data; } catch { return {}; } },
  });
  const isPro = (earnings?.tier_name === "Pro" || earnings?.tier_name === "Business") && (!earnings?.tier_expires_at || new Date(earnings.tier_expires_at) > new Date());

  const { data: posts } = useQuery({
    queryKey: ["my-posts"],
    enabled: !!user,
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Post>>(`/posts/creator/${user!.id}`); return data.data; },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/posts", {
        title, content,
        access_type: accessType === "members" ? "free" : accessType,
        visibility: accessType === "members" ? "members" : accessType === "paid" ? "paid" : "public",
        membership_tier_id: accessType === "members" && memberTierID ? memberTierID : undefined,
        price: accessType === "paid" ? parseInt(price) * 1000 : undefined,
        excerpt: accessType === "paid" && excerpt ? excerpt : undefined,
        status: scheduledAt ? "draft" : "published",
        scheduled_at: scheduledAt || undefined,
      });
      const postId = data.data.id;
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("media_type", getMediaType(files[i].type));
        formData.append("sort_order", String(i));
        await api.post(`/posts/${postId}/media`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-posts"] });
      setShowForm(false); setTitle(""); setContent(""); setPrice(""); setFiles([]);
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

  const published = posts?.filter(p => p.status === "published") || [];
  const drafts = posts?.filter(p => p.status === "draft") || [];

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Posts" }]} className="mb-4" />

      {/* Header with stats */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight">Posts</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">{published.length} published</span>
            {drafts.length > 0 && <span className="text-xs text-amber-500">{drafts.length} draft</span>}
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="rounded-2xl">
          {showForm ? <><X className="mr-1.5 h-4 w-4" /> Tutup</> : <><Plus className="mr-1.5 h-4 w-4" /> Buat Post</>}
        </Button>
      </div>

      {/* Create form — slide down */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
            <Card className="border-primary/20">
              <CardContent className="space-y-4 p-5">
                <Input placeholder="Judul post" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Tulis konten..." value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[120px]" />

                <div>
                  <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.zip" className="hidden" onChange={handleFiles} />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="rounded-xl">
                    <Upload className="mr-1.5 h-4 w-4" /> Upload Media
                  </Button>
                  {files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 text-xs">
                          <Image className="h-3 w-3 text-primary" />
                          <span className="max-w-[120px] truncate">{f.name}</span>
                          <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-500 ml-1 hover:text-red-700 cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Access type — horizontal toggle */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Akses</label>
                  <div className="inline-flex rounded-xl bg-primary-50 dark:bg-navy-800 p-1">
                    {(["free", "paid", "members"] as const).map(t => (
                      <button key={t} onClick={() => setAccessType(t)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${accessType === t ? "bg-white dark:bg-navy-900 text-primary shadow-sm" : "text-gray-500"}`}>
                        {t === "free" ? "Gratis" : t === "paid" ? "Berbayar" : "Members"}
                      </button>
                    ))}
                  </div>
                </div>

                {accessType === "paid" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Harga (Credit)</label>
                      <Input type="number" placeholder="5" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Preview teks</label>
                      <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Teaser singkat..." />
                    </div>
                  </div>
                )}
                {accessType === "members" && membershipTiers && membershipTiers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Tier minimum</label>
                    <select value={memberTierID} onChange={(e) => setMemberTierID(e.target.value)} className="w-full">
                      <option value="">Semua Member</option>
                      {membershipTiers.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.price_credits} Credit/bulan)</option>)}
                    </select>
                  </div>
                )}
                {accessType === "members" && (!membershipTiers || membershipTiers.length === 0) && (
                  <p className="text-xs text-amber-600">⚠️ Belum punya membership tier. <a href="/dashboard/membership" className="underline text-primary">Buat dulu</a></p>
                )}
                {isPro && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Jadwalkan (opsional)</label>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-60" min={new Date().toISOString().slice(0, 16)} />
                  </div>
                )}
                <Button onClick={() => createPost.mutate()} disabled={createPost.isPending || !title || (accessType === "paid" && (!price || isNaN(parseInt(price)) || parseInt(price) < 1))} className="rounded-xl">
                  {createPost.isPending ? "Menyimpan..." : scheduledAt ? "📅 Jadwalkan" : "🚀 Publish"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drafts section */}
      {drafts.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">📝 Draft ({drafts.length})</p>
          <div className="space-y-2">
            {drafts.map((post) => <PostItem key={post.id} post={post} onDelete={(id) => deletePost.mutate(id)} />)}
          </div>
        </div>
      )}

      {/* Published */}
      <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-2">
        {published.map((post) => (
          <motion.div key={post.id} variants={staggerItem}>
            <PostItem post={post} onDelete={(id) => deletePost.mutate(id)} />
          </motion.div>
        ))}
      </motion.div>

      {posts?.length === 0 && (
        <Card><CardContent className="p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3"><FileText className="h-7 w-7 text-primary" /></div>
          <p className="font-display font-bold">Belum ada post</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Buat post pertamamu!</p>
        </CardContent></Card>
      )}
    </div>
  );
}

function PostItem({ post, onDelete }: { post: Post; onDelete: (id: string) => void }) {
  return (
    <Card clickable onClick={() => window.location.href = `/dashboard/posts/${post.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{post.title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={post.status === "published" ? "success" : "warning"}>{post.status}</Badge>
              {post.scheduled_at && post.status === "draft" && (
                <Badge variant="outline" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />{new Date(post.scheduled_at).toLocaleDateString("id-ID")}</Badge>
              )}
              <Badge variant={post.access_type === "paid" ? "secondary" : "outline"}>
                {post.access_type === "paid" ? formatCredit(post.price || 0) : "Gratis"}
              </Badge>
              {post.media?.length > 0 && <Badge variant="outline" className="text-[10px]"><Image className="h-3 w-3 mr-1" />{post.media.length}</Badge>}
              <span className="text-[11px] text-gray-400">{formatDate(post.created_at)}</span>
            </div>
          </div>
          <ConfirmDialog title="Hapus Post?" message="Post yang dihapus tidak bisa dikembalikan." onConfirm={() => onDelete(post.id)}>
            {(open) => <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); open(); }}><Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" /></Button>}
          </ConfirmDialog>
        </div>
      </CardContent>
    </Card>
  );
}

function getMediaType(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}
