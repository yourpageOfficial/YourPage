"use client";

import { useQuery } from "@tanstack/react-query";
import type { Donation } from "@/lib/types";
import { statusColor, statusLabel } from "@/components/ui/standards";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatCredit, formatDate } from "@/lib/utils";
import { Heart, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function SupporterDonations() {
  const { data, isLoading } = useQuery({
    queryKey: ["donations-sent"],
    queryFn: async () => { const { data } = await api.get("/donations/sent?limit=50"); return (data.data || []) as Donation[]; },
  });

  const totalDonated = data?.filter((d: any) => d.status === "paid").reduce((sum: number, d: any) => sum + d.amount_idr, 0) || 0;
  const uniqueCreators = new Set(data?.map((d: any) => d.creator?.id)).size;

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-5">Donasi Terkirim</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-pink-50 to-white dark:from-pink-900/10 dark:to-navy-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-pink-500">{formatCredit(totalDonated)}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Total Donasi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black">{uniqueCreators}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Kreator Didukung</p>
          </CardContent>
        </Card>
      </div>

      {data?.length === 0 && (
        <Card><CardContent className="p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mx-auto mb-3"><Heart className="h-7 w-7 text-pink-500" /></div>
          <p className="font-semibold">Belum pernah mengirim donasi</p>
          <Link href="/explore" className="text-sm text-primary hover:underline mt-2 inline-block">Dukung kreator favoritmu →</Link>
        </CardContent></Card>
      )}

      {/* Grid cards */}
      {data && data.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.map((d: any) => (
            <Card key={d.id} hover className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-pink-400 to-pink-300" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar src={d.creator?.avatar_url} name={d.creator?.display_name} size="sm" className="ring-2 ring-pink-100 dark:ring-pink-900/30" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/c/${d.creator?.username || ""}`} className="font-semibold text-sm hover:text-primary truncate block">{d.creator?.display_name || "Creator"}</Link>
                    <p className="text-[10px] text-gray-400">{formatDate(d.created_at)}</p>
                  </div>
                  <p className="text-lg font-black text-pink-500 shrink-0">{formatCredit(d.amount_idr)}</p>
                </div>
                {d.message && (
                  <div className="bg-primary-50/50 dark:bg-navy-800 rounded-xl px-3 py-2">
                    <p className="text-xs italic text-gray-500 flex items-start gap-1.5">
                      <MessageSquare className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />{d.message}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-gray-400">Net: {formatCredit(d.net_amount_idr)}</span>
                  <Badge className={`${statusColor[d.status] || ""} text-[9px]`}>{statusLabel[d.status] || d.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
