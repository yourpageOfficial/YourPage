"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatIDR, formatCredit, formatDate } from "@/lib/utils";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Lock, Eye, Heart, MessageCircle, Share2, Send } from "lucide-react";
import Link from "next/link";
import { ReportButton } from "@/components/report-button";
import { ContentProtection } from "@/components/content-protection";
import { useAuth } from "@/lib/auth";
import type { Post, ApiResponse } from "@/lib/types";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: post, refetch } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Post>>(`/posts/${id}`);
      const p = data.data;
      setLiked(p.has_liked);
      setLikeCount(p.like_count || 0);
      return p;
    },
  });

  const handleBuy = async () => {
    setBuying(true); setError("");
    try {
      await api.post("/checkout/post", { post_id: id, provider: "credits" });
      refetch();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Gagal";
      setError(msg.includes("Credit") || msg.includes("insufficient") ? "Credit tidak cukup." : msg);
    } finally { setBuying(false); }
  };

  const handleLike = async () => {
    try {
      if (liked) { await api.delete(`/posts/${id}/like`); setLiked(false); setLikeCount(c => c - 1); }
      else { await api.post(`/posts/${id}/like`); setLiked(true); setLikeCount(c => c + 1); }
    } catch {}
  };

  const loadComments = async () => {
    if (!showComments) {
      try { const { data } = await api.get(`/posts/${id}/comments?limit=50`); setComments(data.data || []); } catch {}
    }
    setShowComments(!showComments);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/posts/${id}/comments`, { content: commentText });
      setComments(prev => [...prev, data.data]);
      setCommentText("");
    } catch {}
  };

  if (!post) return <><Navbar /><div className="p-8"><ListSkeleton count={3} /></div></>;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-6 sm:py-8">
        {/* Creator header */}
        {post.creator && (
          <Link href={`/c/${post.creator.username}`} className="flex items-center gap-3 mb-4 sm:mb-6 group">
            {post.creator.avatar_url ? (
              <img src={post.creator.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-bold text-primary">
                {post.creator.display_name?.[0]}
              </div>
            )}
            <div>
              <p className="font-semibold group-hover:text-primary">{post.creator.display_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{post.creator.username}</p>
            </div>
          </Link>
        )}

        {/* Title + meta */}
        <h1 className="text-2xl sm:text-3xl font-bold">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{formatDate(post.created_at)}</span>
          <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {post.view_count}</span>
          {post.access_type === "paid" && (
            <Badge className="bg-secondary-100 text-secondary-600">{formatCredit(post.price || 0)}</Badge>
          )}
          {post.access_type === "free" && <Badge>Gratis</Badge>}
        </div>

        {/* Content */}
        {post.is_locked ? (
          <Card className="mt-8">
            <CardContent className="p-10 text-center">
              <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
                <Lock className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Konten Berbayar</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Beli sekali, akses selamanya.</p>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <div className="mt-6 flex flex-col items-center gap-3">
                {!user ? (
                  <>
                    <Link href={`/login?redirect=/posts/${id}`}>
                      <Button size="lg">Masuk untuk Membeli</Button>
                    </Link>
                    <p className="text-xs text-gray-400">Belum punya akun? <Link href="/register" className="text-primary hover:underline">Daftar gratis</Link></p>
                  </>
                ) : error.includes("Credit") ? (
                  <>
                    <Link href="/wallet/topup"><Button size="lg">Top-up Credit Sekarang</Button></Link>
                    <p className="text-xs text-gray-400">Kamu butuh <span className="font-semibold">{formatCredit(post.price || 0)}</span> untuk membuka konten ini</p>
                  </>
                ) : (
                  <Button size="lg" onClick={handleBuy} disabled={buying}>
                    {buying ? "Memproses..." : `Beli — ${formatCredit(post.price || 0)}`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <ContentProtection enabled={post.access_type === "paid"}>
          <div className="mt-8">
            {post.excerpt && <p className="text-lg text-gray-600 italic border-l-4 border-primary pl-4 mb-6">{post.excerpt}</p>}
            <div className={`prose prose-lg max-w-none whitespace-pre-wrap leading-relaxed ${post.access_type === "paid" ? "select-none" : ""}`}
              onContextMenu={post.access_type === "paid" ? (e) => e.preventDefault() : undefined}>
              {post.content}
            </div>

            {/* Media */}
            {post.media?.length > 0 && (
              <div className="mt-8 space-y-4" onContextMenu={post.access_type === "paid" ? (e) => e.preventDefault() : undefined}>
                {post.media.map((m) => (
                  <div key={m.id} className="rounded-lg overflow-hidden">
                    {m.media_type === "image" && m.url && (
                      <img src={m.url} alt="" loading="lazy" className="w-full rounded-lg" />
                    )}
                    {m.media_type === "video" && m.url && (
                      <video src={m.url} controls playsInline preload="metadata" className="w-full rounded-lg bg-black" />
                    )}
                    {m.media_type === "audio" && m.url && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <audio src={m.url} controls className="w-full" />
                      </div>
                    )}
                    {m.media_type === "document" && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                        <p className="text-gray-500 dark:text-gray-400">📄 Dokumen terlampir</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          </ContentProtection>
        )}

        {/* Actions bar */}
        <div className="mt-8 flex items-center gap-6 py-4 border-t border-b">
          <button onClick={handleLike} className={`flex items-center gap-2 text-sm font-medium transition-colors ${liked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} /> {likeCount} Suka
          </button>
          <button onClick={loadComments} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors">
            <MessageCircle className="h-5 w-5" /> {post.comment_count || 0} Komentar
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors">
              <Share2 className="h-5 w-5" /> Bagikan
            </button>
            <div className="hidden group-hover:flex absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 gap-1 z-10 border dark:border-gray-700">
              <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.title + " " + window.location.href)}`, "_blank")} className="px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded">WhatsApp</button>
              <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, "_blank")} className="px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Twitter</button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link disalin!"); }} className="px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Copy Link</button>
            </div>
          </div>
          <span className="ml-auto"><ReportButton targetType="post" targetId={id} /></span>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-6 space-y-4">
            {comments.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada komentar. Jadilah yang pertama!</p>}
            {comments.map((c: any) => (
              <div key={c.id} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {c.user?.display_name?.[0] || "?"}
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <p className="text-sm font-medium">{c.user?.display_name || "User"} <span className="text-xs text-gray-400 font-normal">{formatDate(c.created_at)}</span></p>
                  <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <Input placeholder="Tulis komentar..." value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()} />
              <Button variant="ghost" onClick={submitComment} disabled={!commentText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
