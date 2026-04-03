"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { formatCredit } from "@/lib/utils";
import { Check, Crown, Zap } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";

export default function SubscriptionPage() {
  const { user, fetchMe } = useAuth();
  const qc = useQueryClient();
  const [confirmTier, setConfirmTier] = useState<any>(null);

  const { data: tiers } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => { const { data } = await api.get("/tiers"); return data.data as any[]; },
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => { const { data } = await api.get("/auth/me"); return data.data; },
  });

  const subscribe = useMutation({
    mutationFn: (tierID: string) => api.post("/auth/subscribe-tier", { tier_id: tierID }),
    onSuccess: () => {
      toast.success("Tier berhasil diupdate!");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      fetchMe();
      setConfirmTier(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Gagal subscribe"),
  });

  const currentTierID = profile?.creator_profile?.tier_id;
  const tierExpires = profile?.creator_profile?.tier_expires_at;
  const freeTierID = (tiers || []).find((t: any) => t.price_idr === 0)?.id;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Subscription</h1>
      {tierExpires && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Tier aktif sampai: {new Date(tierExpires).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {(tiers || []).map((t: any, i: number) => {
          const isCurrent = t.id === currentTierID || (!currentTierID && t.price_idr === 0);
          const icons = [null, <Zap key="z" className="h-5 w-5" />, <Crown key="c" className="h-5 w-5" />];
          return (
            <Card key={t.id} className={`${isCurrent ? "border-primary ring-2 ring-primary/20" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {icons[i]}
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  {isCurrent && <Badge>Aktif</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  {t.price_idr === 0 ? (
                    <p className="text-2xl font-bold">Gratis</p>
                  ) : (
                    <p className="text-2xl font-bold">{formatCredit(t.price_idr)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">Credit/bulan</span></p>
                  )}
                </div>
                <div className="space-y-1.5">
                  {JSON.parse(t.features || "[]").map((f: string) => (
                    <div key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Fee: {t.fee_percent}% · Storage: {(t.storage_bytes / (1024*1024*1024)).toFixed(0)} GB</div>
                {isCurrent ? (
                  <Button disabled className="w-full">Paket Saat Ini</Button>
                ) : (
                  <Button className="w-full" variant={i === 1 ? "default" : "outline"} onClick={() => setConfirmTier(t)}>
                    {t.price_idr === 0 ? "Downgrade" : "Upgrade"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmTier}
        onClose={() => setConfirmTier(null)}
        onConfirm={() => confirmTier && subscribe.mutate(confirmTier.id)}
        title={confirmTier?.price_idr === 0 ? "Downgrade ke Free?" : `Upgrade ke ${confirmTier?.name}?`}
        description={confirmTier?.price_idr === 0
          ? "Fee akan kembali ke 15% dan limit produk 3."
          : `${formatCredit(confirmTier?.price_idr || 0)} Credit akan dipotong dari wallet kamu untuk 1 bulan.`}
        confirmText={confirmTier?.price_idr === 0 ? "Downgrade" : "Bayar & Upgrade"}
        variant={confirmTier?.price_idr === 0 ? "destructive" : "default"}
      />
    </div>
  );
}
