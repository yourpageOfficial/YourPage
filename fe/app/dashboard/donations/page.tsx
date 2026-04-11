"use client";

import { useQuery } from "@tanstack/react-query";
import { statusColor, statusLabel } from "@/components/ui/standards";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatDate } from "@/lib/utils";
import { Heart, MessageSquare, User } from "lucide-react";
import type { PaginatedResponse } from "@/lib/types";

export default function DashboardDonations() {
  const { data: donations } = useQuery({
    queryKey: ["my-donations-received"],
    queryFn: async () => { const { data } = await api.get("/auth/me"); const me = data.data; const res = await api.get<PaginatedResponse<any>>(`/donations/creator/${me.id}?limit=50`); return res.data.data; },
  });

  const totalAmount = donations?.reduce((s: number, d: any) => s + (d.amount_idr || 0), 0) || 0;
  const totalNet = donations?.reduce((s: number, d: any) => s + (d.net_amount_idr || 0), 0) || 0;
  const uniqueDonors = new Set(donations?.map((d: any) => d.supporter?.id || d.donor_name)).size;

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-5">Donasi Diterima</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-pink-50 to-white dark:from-pink-900/10 dark:to-navy-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-pink-500">{formatCredit(totalAmount)}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Total Donasi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-green-500">{formatCredit(totalNet)}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Net Diterima</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black">{uniqueDonors}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Donatur</p>
          </CardContent>
        </Card>
      </div>

      {/* Donation cards — more visual */}
      {donations && donations.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {donations.map((d: any) => (
            <Card key={d.id} hover className="overflow-hidden">
              <div className="h-1" style={{ background: `linear-gradient(90deg, #EC4899, #F472B6)` }} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{d.is_anonymous ? "Anonim" : (d.supporter?.display_name || d.donor_name)}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(d.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-xl font-black text-pink-500">{formatCredit(d.amount_idr)}</p>
                </div>
                {d.message && (
                  <div className="bg-primary-50/50 dark:bg-navy-800 rounded-xl px-3 py-2 mt-2">
                    <p className="text-sm italic text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                      {d.message}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
                  <span>Net: <span className="text-green-500 font-bold">{formatCredit(d.net_amount_idr)}</span></span>
                  <Badge className={`${statusColor[d.status] || ""} text-[9px]`}>{statusLabel[d.status] || d.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mx-auto mb-3"><Heart className="h-7 w-7 text-pink-500" /></div>
          <p className="font-semibold">Belum ada donasi</p>
          <p className="text-sm text-gray-400 mt-1">Bagikan halaman kamu untuk mulai menerima donasi</p>
        </CardContent></Card>
      )}
    </div>
  );
}
