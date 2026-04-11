"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatDate } from "@/lib/utils";
import type { Donation, PaginatedResponse } from "@/lib/types";

export default function DonationsSent() {
  const { data: donations } = useQuery({
    queryKey: ["donations-sent"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Donation>>("/donations/sent");
      return data.data;
    },
  });

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-2xl px-3 sm:px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-display font-black tracking-tight">Donasi Terkirim</h1>
        <div className="space-y-3">
          {donations?.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{formatCredit(d.amount_idr)}</p>
                  {d.message && <p className="text-sm text-gray-600 dark:text-gray-400">&ldquo;{d.message}&rdquo;</p>}
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(d.created_at)}</p>
                </div>
                <Badge>{d.status}</Badge>
              </CardContent>
            </Card>
          ))}
          {donations?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada donasi.</p>}
        </div>
      </main>
    </AuthGuard>
  );
}
