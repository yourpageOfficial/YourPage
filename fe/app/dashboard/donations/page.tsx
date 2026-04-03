"use client";

import { useQuery } from "@tanstack/react-query";
import { statusColor } from "@/components/ui/standards";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";
import type { Donation, PaginatedResponse } from "@/lib/types";


export default function DashboardDonations() {
  const { data: donations } = useQuery({
    queryKey: ["my-donations-received"],
    queryFn: async () => { const { data } = await api.get("/auth/me"); const me = data.data; const res = await api.get<PaginatedResponse<any>>(`/donations/creator/${me.id}?limit=50`); return res.data.data; },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Donasi Diterima</h1>
      <div className="space-y-2">
        {donations?.map((d: any) => (
          <Card key={d.id}>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">{formatIDR(d.amount_idr)}</p>
                <Badge className={statusColor[d.status] || ""}>{d.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-4 text-sm">
                <div><span className="text-gray-500 dark:text-gray-400">Dari:</span> {d.is_anonymous ? "Anonim" : (d.supporter?.display_name || d.donor_name)}</div>
                <div><span className="text-gray-500 dark:text-gray-400">Net:</span> {formatIDR(d.net_amount_idr)}</div>
                <div><span className="text-gray-500 dark:text-gray-400">Tanggal:</span> {formatDate(d.created_at)}</div>
                <div><span className="text-gray-500 dark:text-gray-400">Payment:</span> {d.payment_id?.slice(0, 8)}...</div>
              </div>
              {d.message && <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded mt-1">&ldquo;{d.message}&rdquo;</p>}
            </CardContent>
          </Card>
        ))}
        {donations?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada donasi.</p>}
      </div>
    </div>
  );
}
