"use client";

import { useQuery } from "@tanstack/react-query";
import { statusColor, statusLabel } from "@/components/ui/standards";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatDate } from "@/lib/utils";
import { Heart } from "lucide-react";
import Link from "next/link";


export default function SupporterDonations() {
  const { data } = useQuery({
    queryKey: ["donations-sent"],
    queryFn: async () => { const { data } = await api.get("/donations/sent?limit=50"); return data.data as any[]; },
  });

  const totalDonated = data?.filter((d: any) => d.status === "paid").reduce((sum: number, d: any) => sum + d.amount_idr, 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Donasi Terkirim</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Donasi</p>
          <p className="text-lg font-bold text-primary">{formatCredit(totalDonated)}</p>
        </div>
      </div>

      {data?.length === 0 && (
        <div className="text-center py-12">
          <Heart className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-400" />
          <p className="mt-3 text-gray-500 dark:text-gray-400">Belum pernah mengirim donasi.</p>
          <Link href="/explore"><span className="text-sm text-primary hover:underline">Dukung kreator favoritmu →</span></Link>
        </div>
      )}

      <div className="space-y-2">
        {data?.map((d: any) => (
          <Card key={d.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Creator avatar */}
                <div className="shrink-0">
                  {d.creator?.avatar_url ? (
                    <img src={d.creator.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary">
                      {d.creator?.display_name?.[0] || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/c/${d.creator?.username || ""}`} className="font-medium hover:text-primary">
                        {d.creator?.display_name || "Creator"}
                      </Link>
                      <span className="text-xs text-gray-400 ml-1">@{d.creator?.username}</span>
                    </div>
                    <p className="font-bold text-lg">{formatCredit(d.amount_idr)}</p>
                  </div>
                  {d.message && (
                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">&ldquo;{d.message}&rdquo;</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDate(d.created_at)}</span>
                      <span>·</span>
                      <span>Net ke kreator: {formatCredit(d.net_amount_idr)}</span>
                      <span>·</span>
                      <span>ID: {d.payment_id?.slice(0, 8)}</span>
                    </div>
                    <Badge className={statusColor[d.status] || ""}>{statusLabel[d.status] || d.status}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
