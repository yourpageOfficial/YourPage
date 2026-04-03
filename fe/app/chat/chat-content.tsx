"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";

export default function ChatContent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [activeConv, setActiveConv] = useState<any>(null);
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const initCreator = searchParams.get("creator");

  const { data: conversations } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => { const { data } = await api.get("/chat"); return (data.data || []) as any[]; },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (initCreator && conversations && !activeConv) {
      const existing = conversations.find((c: any) => c.creator_id === initCreator);
      if (existing) setActiveConv(existing);
    }
  }, [initCreator, conversations, activeConv]);

  const { data: messages } = useQuery({
    queryKey: ["chat-messages", activeConv?.id],
    queryFn: async () => { const { data } = await api.get(`/chat/${activeConv.id}?limit=50`); return ((data.data || []) as any[]).reverse(); },
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

  // CHAT DETAIL
  if (activeConv) {
    const other = getOtherUser(activeConv);
    return (
      <AuthGuard><Navbar />
        <div className="mx-auto max-w-2xl flex flex-col h-[calc(100vh-3.5rem-3.5rem)] sm:h-[calc(100vh-4rem)]">
          <div className="flex items-center gap-3 p-3 border-b dark:border-gray-700 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveConv(null)}><ArrowLeft className="h-4 w-4" /></Button>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">{other?.display_name?.[0]}</div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{other?.display_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">@{other?.username}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
            {(!messages || messages.length === 0) && <p className="text-center text-sm text-gray-400 py-8">Mulai percakapan...</p>}
            {messages?.map((m: any) => {
              const isMe = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                  {!isMe && <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold mt-1 shrink-0">{m.sender?.display_name?.[0]}</div>}
                  <div className={`max-w-[70%] rounded-2xl px-3 py-2 ${isMe ? "bg-primary text-white rounded-br-sm" : "bg-gray-100 dark:bg-gray-800 rounded-bl-sm"}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {m.is_paid && <Badge className="text-[8px] bg-yellow-500 text-white px-1 py-0">💰</Badge>}
                      <span className={`text-[10px] ${isMe ? "text-white/50" : "text-gray-400"}`}>{new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2 p-3 border-t dark:border-gray-700 shrink-0">
            <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Tulis pesan..." className="flex-1"
              onKeyDown={e => { if (e.key === "Enter" && message.trim()) send.mutate(); }} />
            <Button size="icon" onClick={() => send.mutate()} disabled={!message.trim() || send.isPending}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // NEW CHAT
  if (initCreator && (!conversations || !conversations.find((c: any) => c.creator_id === initCreator))) {
    return (
      <AuthGuard><Navbar />
        <div className="mx-auto max-w-2xl p-4">
          <h1 className="text-lg font-bold mb-4">Chat Baru</h1>
          <Card><CardContent className="p-4 space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">Kirim pesan pertama</p>
            <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Tulis pesan..."
              onKeyDown={e => { if (e.key === "Enter" && message.trim()) startChat.mutate(); }} />
            <Button onClick={() => startChat.mutate()} disabled={!message.trim() || startChat.isPending} className="w-full"><Send className="mr-2 h-4 w-4" /> Kirim</Button>
          </CardContent></Card>
        </div>
      </AuthGuard>
    );
  }

  // CONVERSATION LIST
  return (
    <AuthGuard><Navbar />
      <div className="mx-auto max-w-2xl p-4">
        <h1 className="text-xl font-bold mb-4">Chat</h1>
        {(!conversations || conversations.length === 0) && (
          <Card><CardContent className="p-8 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada percakapan</p>
            <p className="text-xs text-gray-400 mt-1">Kunjungi halaman creator dan klik 💬 Chat</p>
          </CardContent></Card>
        )}
        <div className="space-y-1">
          {conversations?.map((conv: any) => {
            const other = getOtherUser(conv);
            const unread = getUnread(conv);
            return (
              <div key={conv.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${unread > 0 ? "bg-primary/5" : ""}`}
                onClick={() => setActiveConv(conv)}>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">{other?.display_name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${unread > 0 ? "font-bold" : "font-medium"}`}>{other?.display_name}</p>
                    {conv.last_message_at && <span className="text-[10px] text-gray-400 shrink-0">{new Date(conv.last_message_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{other?.username}</p>
                </div>
                {unread > 0 && <div className="h-5 min-w-[20px] rounded-full bg-primary text-white text-xs flex items-center justify-center px-1.5 shrink-0">{unread}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </AuthGuard>
  );
}
