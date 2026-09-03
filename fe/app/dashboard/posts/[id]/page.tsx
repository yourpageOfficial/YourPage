"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit } from "@/lib/utils";
import { ListSkeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, Music, Save, Trash2, Upload } from "lucide-react";
import type { Post, ApiResponse } from "@/lib/types";
import { useTranslation } from "@/lib/internationalization";

export default function DashboardPostDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { t, interpolate } = useTranslation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [accessType, setAccessType] = useState<"free" | "paid" | "members">("free");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [memberTierID, setMemberTierID] = useState("");

  const { data: post } = useQuery({
    queryKey: ["my-post", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Post>>(`/posts/${id}`);
      return data.data;
    },
  });

  const { data: membershipTiers } = useQuery({
    queryKey: ["my-membership-tiers-edit"],
    queryFn: async () => { const me = await api.get("/auth/me"); const { data } = await api.get(`/membership-tiers/${me.data.data.id}`); return data.data as any[]; },
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content || "");
      setExcerpt(post.excerpt || "");
      setAccessType(post.visibility === "members" ? "members" : post.access_type);
      setMemberTierID((post as any).membership_tier_id || "");
      setPrice(post.price ? String(Math.floor(post.price / 1000)) : "");
      setStatus(post.status);
    }
  }, [post]);

  const save = useMutation({
    mutationFn: () => api.put(`/posts/${id}`, {
      title, content, excerpt: excerpt || undefined,
      access_type: accessType === "members" ? "free" : accessType,
      visibility: accessType === "members" ? "members" : accessType === "paid" ? "paid" : "public",
      membership_tier_id: accessType === "members" && memberTierID ? memberTierID : undefined,
      price: accessType === "paid" ? parseInt(price) * 1000 : undefined,
      status,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-post", id] }); toast.success(t.contentMgr.postSaved); },
    onError: (err: any) => toast.error(err.response?.data?.error || t.contentMgr.saveFailed),
  });

  const addMedia = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("media_type", file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("image/") ? "image" : "document");
      fd.append("sort_order", String(post?.media?.length || 0));
      await api.post(`/posts/${id}/media`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-post", id] }),
  });

  const deleteMedia = useMutation({
    mutationFn: (mediaId: string) => api.delete(`/posts/${id}/media/${mediaId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-post", id] }),
  });

  if (!post) return <ListSkeleton count={3} />;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/posts")} className="mb-4">
        <ArrowLeft className="mr-1 h-4 w-4" /> {t.contentMgr.back}
      </Button>

      <Card className="mb-6">
        <CardHeader><CardTitle>{t.contentMgr.editPost}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder={t.contentMgr.postTitleLabel} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder={t.contentMgr.excerptOptional} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          <Textarea placeholder={t.contentMgr.contentLabel} value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[150px]" />
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={accessType === "free" ? "default" : "outline"} onClick={() => setAccessType("free")}>{t.contentMgr.free}</Button>
            <Button size="sm" variant={accessType === "paid" ? "default" : "outline"} onClick={() => setAccessType("paid")}>{t.contentMgr.paid}</Button>
            <Button size="sm" variant={accessType === "members" ? "default" : "outline"} onClick={() => setAccessType("members")}>{t.contentMgr.membersOnly}</Button>
            {accessType === "paid" && <Input type="number" placeholder={t.contentMgr.priceCredit} value={price} onChange={(e) => setPrice(e.target.value)} className="w-40" />}
          </div>
          {accessType === "members" && membershipTiers && membershipTiers.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t.contentMgr.selectTierMinimum}</label>
              <select value={memberTierID} onChange={(e) => setMemberTierID(e.target.value)} className="w-full mt-1 rounded-xl border border-primary-200 dark:border-primary-900/40 bg-white dark:bg-navy-800 px-3 py-2 text-sm">
                <option value="">{t.contentMgr.allMembers}</option>
                {membershipTiers.map((tier: any) => (
                  <option key={tier.id} value={tier.id}>{tier.name} ({interpolate(t.contentMgr.creditPerMonth, { count: tier.price_credits })})</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={status === "draft" ? "outline" : "default"} onClick={() => setStatus(status === "draft" ? "published" : "draft")}>
              {status === "published" ? t.contentMgr.publishedStatus : t.contentMgr.draftStatus}
            </Button>
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="mr-1 h-4 w-4" /> {save.isPending ? t.contentMgr.saving : t.contentMgr.save}
          </Button>
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{interpolate(t.contentMgr.mediaCount, { count: post.media?.length || 0 })}</CardTitle>
            <div>
              <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.zip" className="hidden"
                onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(f => addMedia.mutate(f)); }} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> {t.contentMgr.upload}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {post.media?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t.contentMgr.noMedia}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {post.media?.map((m) => (
              <div key={m.id} className="relative group rounded border overflow-hidden">
                {m.media_type === "image" && m.url && <img loading="lazy" src={m.url} alt="" className="h-32 w-full object-cover" />}
                {m.media_type === "video" && m.url && (
                  // Thumbnail grid: never download the clip just to show a tile.
                  <video src={m.url} poster={m.thumb_url || undefined} preload="none" className="h-32 w-full object-cover" />
                )}
                {m.media_type === "audio" && <div className="h-32 flex items-center justify-center bg-primary-50/50 dark:bg-navy-800"><Music className="h-7 w-7 text-gray-400" aria-label="Audio" /></div>}
                {m.media_type === "document" && <div className="h-32 flex items-center justify-center bg-primary-50/50 dark:bg-navy-800"><FileText className="h-7 w-7 text-gray-400" aria-label="Dokumen" /></div>}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => deleteMedia.mutate(m.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Badge className="absolute bottom-1 left-1 text-[10px]">{m.media_type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
