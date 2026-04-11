"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { formatDate } from "@/lib/utils";
import { Bell, Heart, ShoppingCart, UserPlus, MessageCircle, CreditCard } from "lucide-react";
import type { Notification, PaginatedResponse } from "@/lib/types";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  donation: { icon: Heart, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
  purchase: { icon: ShoppingCart, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
  follow: { icon: UserPlus, color: "text-blue-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
  chat: { icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  topup: { icon: CreditCard, color: "text-accent-600", bg: "bg-accent-50 dark:bg-accent-900/20" },
};

function groupByDate(notifs: Notification[]) {
  const groups: Record<string, Notification[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  for (const n of notifs) {
    const d = new Date(n.created_at).toDateString();
    const label = d === today ? "Hari ini" : d === yesterday ? "Kemarin" : formatDate(n.created_at);
    (groups[label] ||= []).push(n);
  }
  return groups;
}

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data: notifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Notification>>("/notifications"); return data.data; },
  });

  const markAll = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const grouped = notifs ? groupByDate(notifs) : {};

  return (
    <AuthGuard>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-display font-black tracking-tight">Notifikasi</h1>
            <Button variant="ghost" size="sm" onClick={() => markAll.mutate()} loading={markAll.isPending} className="rounded-xl text-xs">Tandai dibaca</Button>
          </div>
          {notifs?.length === 0 && (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4"><Bell className="h-8 w-8 text-primary" /></div>
              <p className="font-semibold">Semua sudah dibaca</p>
              <p className="text-xs text-gray-400 mt-1">Notifikasi baru akan muncul di sini</p>
            </div>
          )}
          {Object.entries(grouped).map(([label, items]) => (
            <div key={label} className="mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
              <div className="space-y-2">
                {items.map((n) => {
                  const cfg = typeConfig[n.type] || { icon: Bell, color: "text-gray-400", bg: "bg-primary-50/50 dark:bg-navy-800" };
                  const Icon = cfg.icon;
                  return (
                    <Card key={n.id} hover className={n.is_read ? "opacity-50" : ""}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{n.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                        </div>
                        {!n.is_read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
      </PageTransition>
    </AuthGuard>
  );
}
