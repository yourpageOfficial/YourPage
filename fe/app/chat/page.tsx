"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";
import { ListSkeleton } from "@/components/ui/skeleton";

export default function ChatPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeConv, setActiveConv] = useState<any>(null);
  const [message, setMessage] = useState("");

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => { const { data } = await api.get("/chat"); return data.data as any[]; },
    refetchInterval: 5000,
  });

  const { data: messages } = useQuery({
    queryKey: ["chat-messages", activeConv?.id],
    queryFn: async () => { const { data } = await api.get(`/chat/${activeConv.id}?limit=50`); return (data.data as any[]).reverse(); },
    enabled: !!activeConv,
    refetchInterval: 3000,
  });

  const send = useMutation({
    mutationFn: () => api.post("/chat", { creator_id: getCreatorId(), content: message }),
    onSuccess: () => { setMessage(""); qc.invalidateQueries({ queryKey: ["chat-messages", activeConv?.id] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Gagal kirim"),
  });

  const getCreatorId = () => {
    if (!activeConv || !user) return "";
    return activeConv.creator_id === user.id ? activeConv.supporter_id : activeConv.creator_id;
  };

  const getOtherUser = (conv: any) => {
    if (!user) return null;
    return conv.creator_id === user.id ? conv.supporter : conv.creator;
  };

  const getUnread = (conv: any) => {
    if (!user) return 0;
    return conv.creator_id === user.id ? conv.creator_unread : conv.supporter_unread;
  };

  if (isLoading) return <ListSkeleton count={3} />;

  // Chat detail view
  if (activeConv) {
    const other = getOtherUser(activeConv);
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 pb-3 border-b dark:border-gray-700">
          <Button variant="ghost" size="icon" onClick={() => setActiveConv(null)}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{other?.display_name?.[0]}</div>
          <div>
            <p className="font-medium text-sm">{other?.display_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">@{other?.username}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages?.map((m: any) => (
            <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.sender_id === user?.id ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                <p className="text-sm">{m.content}</p>
                <div className="flex items-center gap-1 mt-1">
                  {m.is_paid && <Badge className="text-[9px] bg-yellow-500 text-white">💰 Paid</Badge>}
                  <span className={`text-[10px] ${m.sender_id === user?.id ? "text-white/60" : "text-gray-400 dark:text-gray-500"}`}>{formatDate(m.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
          {(!messages || messages.length === 0) && <p className="text-center text-sm text-gray-400 dark:text-gray-500">Belum ada pesan</p>}
        </div>

        <div className="flex gap-2 pt-3 border-t dark:border-gray-700">
          <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Tulis pesan..."
            onKeyDown={e => e.key === "Enter" && message.trim() && send.mutate()} />
          <Button onClick={() => send.mutate()} disabled={!message.trim() || send.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Conversation list
  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Chat</h1>
      {conversations?.length === 0 && (
        <Card><CardContent className="p-8 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Belum ada percakapan</p>
        </CardContent></Card>
      )}
      <div className="space-y-2">
        {conversations?.map((conv: any) => {
          const other = getOtherUser(conv);
          const unread = getUnread(conv);
          return (
            <Card key={conv.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveConv(conv)}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">{other?.display_name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{other?.display_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{other?.username}</p>
                </div>
                <div className="text-right shrink-0">
                  {unread > 0 && <Badge className="bg-red-500 text-white text-xs">{unread}</Badge>}
                  {conv.last_message_at && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{formatDate(conv.last_message_at)}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
