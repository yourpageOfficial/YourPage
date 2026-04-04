"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Notification, PaginatedResponse } from "@/lib/types";

export default function NotificationsPage() {
  const t = useTranslations("Notifications");
  const qc = useQueryClient();

  const { data: notifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Notification>>("/notifications");
      return data.data;
    },
  });

  const markAll = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-2xl px-3 sm:px-4 py-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <Button variant="ghost" size="sm" onClick={() => markAll.mutate()}>{t("mark_all_read")}</Button>
        </div>
        <div className="space-y-3">
          {notifs?.map((n) => (
            <Card key={n.id} className={n.is_read ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
              </CardContent>
            </Card>
          ))}
          {notifs?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>}
        </div>
      </main>
    </AuthGuard>
  );
}
