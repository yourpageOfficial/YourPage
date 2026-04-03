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
    } catch {}
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const { data } = await api.get(`/posts/${post.id}/comments?limit=20`);
        setComments(data.data || []);
      } catch {}
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
    } catch {}
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
    <Card>
      {/* Header with avatar */}
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <Link href={`/c/${post.creator?.username || ""}`} className="shrink-0">
            {post.creator?.avatar_url ? (
              <img src={post.creator.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary">
                {post.creator?.display_name?.[0] || "?"}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/c/${post.creator?.username || ""}`} className="hover:underline">
                <span className="font-medium text-sm">{post.creator?.display_name || "Creator"}</span>
              </Link>
              <Link href={`/c/${post.creator?.username || ""}`} className="hover:underline">
                <span className="text-xs text-gray-400">@{post.creator?.username}</span>
              </Link>
            </div>
            <Link href={`/posts/${post.id}`} className="hover:text-primary">
              <p className="font-semibold mt-0.5">{post.title}</p>
            </Link>
            <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
          </div>
          {post.access_type === "paid" && (
            <Badge className="bg-secondary-100 text-secondary-600 shrink-0">{formatCredit(post.price || 0)}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLocked ? (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-dashed dark:border-gray-600 p-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Konten berbayar</p>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="mt-3 flex flex-col items-center gap-2">
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
            {post.excerpt && <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>}
            <p className="text-sm whitespace-pre-wrap">{post.content?.slice(0, 300)}{(post.content?.length || 0) > 300 ? "..." : ""}</p>
            {post.media?.length > 0 && (
              <div className="mt-3 space-y-2">
                {post.media.map((m) => {
                  if (!m.url && !m.thumb_url) return null;
                  if (m.media_type === "video") return <video key={m.id} src={m.url} controls playsInline preload="metadata" className="w-full max-h-80 rounded object-contain bg-black" />;
                  if (m.media_type === "audio") return <audio key={m.id} src={m.url} controls className="w-full" />;
                  return <img key={m.id} src={m.thumb_url || m.url} alt="" loading="lazy" className="w-full max-h-96 rounded object-cover" />;
                })}
              </div>
            )}
          </>
        )}

        {/* Actions: Like, Comment, Share */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t">
          <button onClick={handleLike} className={`flex items-center gap-1 text-sm transition-colors ${liked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} /> {likeCount}
          </button>
          <button onClick={loadComments} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
            <MessageCircle className="h-5 w-5" /> {commentCount}
          </button>
          <button onClick={handleShare} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
          <span className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <ReportButton targetType="post" targetId={post.id} />
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.view_count}</span>
          </span>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 space-y-2">
            {comments.map((c: any) => (
              <div key={c.id} className="flex gap-2 text-sm">
                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {c.user?.display_name?.[0] || "?"}
                </div>
                <div>
                  <span className="font-medium">{c.user?.display_name || "User"}</span>{" "}
                  <span className="text-gray-600">{c.content}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Tulis komentar..." value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()} className="h-8 text-sm" />
              <Button size="sm" variant="ghost" onClick={submitComment} disabled={!commentText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
