"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, Heart, MessageCircle, Share2, Send } from "lucide-react";
import { formatIDR, formatCredit, formatDate } from "@/lib/utils";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { ReportButton } from "@/components/report-button";
import type { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [liked, setLiked] = useState(post.has_liked);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const qc = useQueryClient();

  const handleBuy = async () => {
    setBuying(true); setError("");
    try {
      await api.post("/checkout/post", { post_id: post.id, provider: "credits" });
      setUnlocked(true);
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Gagal";
      setError(msg.includes("Credit") || msg.includes("insufficient") ? "Credit tidak cukup. Top-up dulu." : msg.includes("already") || msg.includes("sudah") ? "" : msg);
      if (msg.includes("already")) setUnlocked(true);
    } finally { setBuying(false); }
  };

  const handleLike = async () => {
    try {
      if (liked) {
        await api.delete(`/posts/${post.id}/like`);
        setLiked(false); setLikeCount(c => c - 1);
      } else {
        await api.post(`/posts/${post.id}/like`);
        setLiked(true); setLikeCount(c => c + 1);
      }
    } catch (e: any) { toast.error(e.response?.data?.error || "Gagal") }
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const { data } = await api.get(`/posts/${post.id}/comments?limit=20`);
        setComments(data.data || []);
      } catch (e: any) { toast.error(e.response?.data?.error || "Gagal") }
    }
    setShowComments(!showComments);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/posts/${post.id}/comments`, { content: commentText });
      setComments(prev => [...prev, data.data]);
      setCommentText("");
      setCommentCount(c => c + 1);
    } catch (e: any) { toast.error(e.response?.data?.error || "Gagal") }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link disalin!");
    }
  };

  const isLocked = post.is_locked && !unlocked;

  return (
    <Card hover>
      {/* Header */}
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <Link href={`/c/${post.creator?.username || ""}`} className="shrink-0">
            {post.creator?.avatar_url ? (
              <img src={post.creator.avatar_url} alt="" className="h-11 w-11 rounded-2xl object-cover ring-2 ring-primary/10" />
            ) : (
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center text-sm font-bold text-primary">
                {post.creator?.display_name?.[0] || "?"}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/c/${post.creator?.username || ""}`} className="hover:underline">
                <span className="font-semibold text-sm">{post.creator?.display_name || "Creator"}</span>
              </Link>
              <span className="text-xs text-gray-400">@{post.creator?.username}</span>
            </div>
            <Link href={`/posts/${post.id}`} className="hover:text-primary transition-colors">
              <p className="font-bold mt-0.5">{post.title}</p>
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">{formatDate(post.created_at)}</p>
          </div>
          {post.access_type === "paid" && (
            <Badge variant="secondary" className="shrink-0">{formatCredit(post.price || 0)}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLocked ? (
          <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-primary-200/50 dark:border-blue-800/30 p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-navy-800 shadow-sm flex items-center justify-center mx-auto mb-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Konten berbayar</p>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="mt-4">
              {error.includes("Top-up") || error.includes("Credit") ? (
                <Link href="/wallet/topup"><Button size="sm">Top-up Credit</Button></Link>
              ) : (
                <Button size="sm" onClick={handleBuy} disabled={buying}>
                  {buying ? "Memproses..." : `Beli ${formatCredit(post.price || 0)}`}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {post.excerpt && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{post.excerpt}</p>}
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content?.slice(0, 300)}{(post.content?.length || 0) > 300 ? "..." : ""}</p>
            {post.media?.length > 0 && (
              <div className="mt-3 space-y-2">
                {post.media.map((m) => {
                  if (!m.url && !m.thumb_url) return null;
                  if (m.media_type === "video") return <video key={m.id} src={m.url} controls playsInline preload="metadata" className="w-full max-h-80 rounded-2xl object-contain bg-black" />;
                  if (m.media_type === "audio") return <audio key={m.id} src={m.url} controls className="w-full" />;
                  return <img key={m.id} src={m.thumb_url || m.url} alt="" loading="lazy" className="w-full max-h-96 rounded-2xl object-cover" />;
                })}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-primary-100/50 dark:border-primary-900/20">
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-all ${liked ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"}`}>
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likeCount}
          </button>
          <button onClick={loadComments} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-2 rounded-xl transition-all">
            <MessageCircle className="h-4 w-4" /> {commentCount}
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-2 rounded-xl transition-all">
            <Share2 className="h-4 w-4" />
          </button>
          <span className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <ReportButton targetType="post" targetId={post.id} />
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.view_count}</span>
          </span>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-3 space-y-2.5">
            {comments.map((c: any) => (
              <div key={c.id} className="flex gap-2.5 text-sm">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {c.user?.display_name?.[0] || "?"}
                </div>
                <div className="bg-primary-50/50 dark:bg-navy-800 rounded-2xl px-3 py-2">
                  <span className="font-semibold text-xs">{c.user?.display_name || "User"}</span>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Tulis komentar..." value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()} className="h-9 text-sm rounded-xl" />
              <Button size="sm" variant="ghost" onClick={submitComment} disabled={!commentText.trim()} className="rounded-xl">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
