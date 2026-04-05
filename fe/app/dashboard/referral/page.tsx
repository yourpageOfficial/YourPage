"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { Gift, Copy } from "lucide-react";

export default function ReferralPage() {
  const { data: referral } = useQuery({
    queryKey: ["my-referral"],
    queryFn: async () => { const { data } = await api.get("/referral"); return data.data; },
  });

  const url = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${referral?.code || ""}` : "";

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Referral</h1>
      <Card className="mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-base"><Gift className="inline h-5 w-5 mr-1" /> Ajak Teman, Dapat Credit!</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Bagikan kode referral kamu. Kamu dan teman yang mendaftar masing-masing dapat <strong>10 Credit gratis</strong>!</p>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Kode Referral</label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={referral?.code || "Loading..."} className="font-mono" />
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(referral?.code || ""); toast.success("Kode disalin!"); }}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Link Referral</label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={url} className="text-xs" />
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link disalin!"); }}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Daftar di YourPage pakai link ini dan dapat 10 Credit gratis! " + url)}`, "_blank")}>Share WhatsApp</Button>
            <Button size="sm" variant="outline" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Daftar di @YourPage dan dapat 10 Credit gratis!")}&url=${encodeURIComponent(url)}`, "_blank")}>Share Twitter</Button>
          </div>
          <p className="text-xs text-gray-400">Sudah digunakan: {referral?.used_count || 0} kali</p>
        </CardContent>
      </Card>
    </div>
  );
}
