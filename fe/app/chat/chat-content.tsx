"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import type { ChatConversation, ChatMessage } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Send, ArrowLeft, Coins, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import { motion } from "framer-motion";
import { staggerChildren, staggerItem } from "@/lib/motion-variants";

export default function ChatContent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [activeConv, setActiveConv] = useState<any>(null);
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const initCreator = searchParams.get("creator");
  const chatPrice = parseInt(searchParams.get("price") || "0");

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => { const { data } = await api.get("/chat"); return (data.data || []) as ChatConversation[]; },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (initCreator && conversations && !activeConv) {
      const existing = conversations.find((c: any) => c.creator_id === initCreator);
      if (existing) setActiveConv(existing);
    }
  }, [initCreator, conversations, activeConv]);

  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ["chat-messages", activeConv?.id],
    queryFn: async () => { const { data } = await api.get(`/chat/${activeConv.id}?limit=50`); return ((data.data || []) as ChatMessage[]).reverse(); },
    enabled: !!activeConv?.id,
    refetchInterval: 3000,
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useMutation({
    mutationFn: () => api.post("/chat", {
      creator_id: activeConv ? activeConv.creator_id : initCreator,
      conversation_id: activeConv?.id,
      content: message,
    }),
    onSuccess: () => { setMessage(""); qc.invalidateQueries({ queryKey: ["chat-messages", activeConv?.id] }); qc.invalidateQueries({ queryKey: ["chat-conversations"] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Gagal kirim"),
  });

  const startChat = useMutation({
    mutationFn: () => api.post("/chat", { creator_id: initCreator, content: message }),
    onSuccess: () => { setMessage(""); qc.invalidateQueries({ queryKey: ["chat-conversations"] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Gagal kirim"),
  });

  const getOtherUser = (conv: any) => !user ? null : conv.creator_id === user.id ? conv.supporter : conv.creator;
  const getUnread = (conv: any) => !user ? 0 : conv.creator_id === user.id ? conv.creator_unread : conv.supporter_unread;

  // NEW CHAT (no existing conversation)
  if (initCreator && (!conversations || !conversations.find((c: any) => c.creator_id === initCreator))) {
    return (
      <AuthGuard><Navbar />
        <div className="mx-auto max-w-md p-4 pt-10">
          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-lg font-display font-black tracking-tight">Chat Baru</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kirim pesan pertama</p>
          </div>
          <Card>
            <CardContent className="p-5 space-y-3">
              {chatPrice > 0 && (
                <div className="flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-xl px-3 py-2">
                  <Coins className="h-4 w-4 text-accent shrink-0" />
                  <p className="text-xs text-accent-700 dark:text-accent-300">Setiap pesan dikenakan <span className="font-bold">{chatPrice / 1000} Credit</span></p>
                </div>
              )}
              <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Tulis pesan..." className="rounded-2xl"
                onKeyDown={e => { if (e.key === "Enter" && message.trim()) startChat.mutate(); }} />
              <Button onClick={() => startChat.mutate()} disabled={!message.trim() || startChat.isPending} loading={startChat.isPending} className="w-full">
                <Send className="mr-2 h-4 w-4" /> Kirim
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // MAIN LAYOUT — split panel on desktop, stacked on mobile
  return (
    <AuthGuard><Navbar />
      <div className="mx-auto max-w-5xl h-[calc(100vh-3.5rem-3.5rem)] sm:h-[calc(100vh-4rem)] flex">
        {/* Sidebar — conversation list */}
        <div className={`${activeConv ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-80 sm:min-w-[320px] border-r border-primary-100 dark:border-primary-900/30 bg-white dark:bg-navy-900`}>
          {/* Sidebar header */}
          <div className="px-4 py-4 border-b border-primary-100 dark:border-primary-900/30 shrink-0">
            <h1 className="text-lg font-display font-black tracking-tight">Chat</h1>
            {conversations && conversations.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{conversations.length} percakapan</p>
            )}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs && (
              <div className="p-3 space-y-1">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-16" /></div>
                  </div>
                ))}
              </div>
            )}

            {!loadingConvs && (!conversations || conversations.length === 0) && (
              <div className="text-center py-16 px-4">
                <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-7 w-7 text-primary/40" />
                </div>
                <p className="font-display font-bold text-sm">Belum ada percakapan</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kunjungi halaman kreator dan mulai chat</p>
              </div>
            )}

            {conversations && conversations.length > 0 && (
              <div className="p-2 space-y-0.5">
                {conversations.map((conv: any) => {
                  const other = getOtherUser(conv);
                  const unread = getUnread(conv);
                  const isActive = activeConv?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                        isActive
                          ? "bg-primary-50 dark:bg-primary-900/20 border border-primary/20"
                          : unread > 0
                            ? "bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-navy-800"
                      }`}
                      onClick={() => setActiveConv(conv)}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={other?.avatar_url} name={other?.display_name} size="md" />
                        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-navy-900 animate-pulse-dot" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${unread > 0 ? "font-bold text-primary" : "font-medium"}`}>{other?.display_name}</p>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {new Date(conv.last_message_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{other?.username}</p>
                      </div>
                      {unread > 0 && (
                        <div className="h-5 min-w-[20px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1.5 shrink-0">
                          {unread}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat detail panel */}
        <div className={`${activeConv ? "flex" : "hidden sm:flex"} flex-col flex-1 bg-white dark:bg-navy-900`}>
          {!activeConv ? (
            /* Empty state — desktop only */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-4">
                <div className="h-16 w-16 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-primary/30" />
                </div>
                <p className="font-display font-bold text-gray-400">Pilih percakapan</p>
                <p className="text-sm text-gray-400 mt-1">Pilih chat dari daftar di samping</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-primary-100 dark:border-primary-900/30 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={() => setActiveConv(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar src={getOtherUser(activeConv)?.avatar_url} name={getOtherUser(activeConv)?.display_name} size="md" className="ring-2 ring-primary/10" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{getOtherUser(activeConv)?.display_name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">@{getOtherUser(activeConv)?.username}</p>
                </div>
                {chatPrice > 0 && activeConv?.creator_id !== user?.id && (
                  <Badge variant="warning" className="text-[10px] gap-1">
                    <Coins className="h-3 w-3" /> {chatPrice / 1000} Credit
                  </Badge>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingMsgs && (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-36" : "w-48"}`} />
                      </div>
                    ))}
                  </div>
                )}
                {!loadingMsgs && (!messages || messages.length === 0) && (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-6 w-6 text-primary/40" />
                    </div>
                    <p className="text-sm text-gray-400">Mulai percakapan...</p>
                  </div>
                )}
                {messages?.map((m: any) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                      {!isMe && <Avatar src={m.sender?.avatar_url} name={m.sender?.display_name} size="sm" className="mt-1 shrink-0" />}
                      <div className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 ${
                        isMe
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-primary-50 dark:bg-navy-800 rounded-bl-md"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {m.is_paid && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isMe ? "bg-white/20 text-white/80" : "bg-accent/10 text-accent"}`}>
                              <Coins className="h-2.5 w-2.5 inline mr-0.5" />Paid
                            </span>
                          )}
                          <span className={`text-[10px] ${isMe ? "text-white/50" : "text-gray-400"}`}>
                            {new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-primary-100 dark:border-primary-900/30 shrink-0">
                <div className="flex gap-2">
                  <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Tulis pesan..." className="flex-1 rounded-2xl"
                    onKeyDown={e => { if (e.key === "Enter" && message.trim()) send.mutate(); }} />
                  <Button size="icon" onClick={() => send.mutate()} disabled={!message.trim() || send.isPending} className="rounded-2xl shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
