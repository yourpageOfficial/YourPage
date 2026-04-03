"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { formatCredit } from "@/lib/utils";
import { Target, MessageSquare } from "lucide-react";

export default function DonationSettingsPage() {
  const qc = useQueryClient();
  const [goalTitle, setGoalTitle] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [welcomeMsg, setWelcomeMsg] = useState("");

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data; } catch { return {}; } },
  });

  useEffect(() => {
    if (earnings) {
      setGoalTitle(earnings.donation_goal_title || "");
      setGoalAmount(earnings.donation_goal_amount ? String(earnings.donation_goal_amount / 1000) : "");
      setWelcomeMsg(earnings.welcome_message || "");
    }
  }, [earnings]);

  const save = useMutation({
    mutationFn: () => api.put("/auth/me", {
      donation_goal_title: goalTitle || null,
      donation_goal_amount: goalAmount ? parseInt(goalAmount) * 1000 : 0,
      welcome_message: welcomeMsg || null,
    }),
    onSuccess: () => { toast.success("Pengaturan disimpan!"); qc.invalidateQueries({ queryKey: ["creator-earnings"] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Gagal"),
  });

  const goalCurrent = earnings?.donation_goal_current || 0;
  const goalTarget = goalAmount ? parseInt(goalAmount) * 1000 : 0;
  const goalPct = goalTarget > 0 ? Math.min((goalCurrent / goalTarget) * 100, 100) : 0;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Pengaturan Donasi</h1>

      {/* Donation Goal */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5" /> Target Donasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Tampilkan target donasi di halaman kamu untuk memotivasi supporter.</p>
          <Input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="Contoh: Beli kamera baru untuk konten lebih bagus 📸" />
          <div className="flex items-center gap-2">
            <Input type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder="Target (Credit)" className="w-40" />
            <span className="text-sm text-gray-500">Credit</span>
          </div>
          {goalTarget > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{formatCredit(goalCurrent)} terkumpul</span>
                <span>{formatCredit(goalTarget)} target</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goalPct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{goalPct.toFixed(0)}% tercapai</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setGoalAmount("500")}>500 Credit</Button>
            <Button size="sm" variant="outline" onClick={() => setGoalAmount("1000")}>1K Credit</Button>
            <Button size="sm" variant="outline" onClick={() => setGoalAmount("5000")}>5K Credit</Button>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Pesan Penyambutan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pesan otomatis yang tampil setelah seseorang berdonasi atau membeli produk kamu.</p>
          <Textarea value={welcomeMsg} onChange={e => setWelcomeMsg(e.target.value)}
            placeholder="Contoh: Terima kasih banyak atas dukungannya! 🙏 Kamu yang terbaik. Cek konten eksklusif saya di tab Posts ya!" />
          <p className="text-xs text-gray-400">{welcomeMsg.length}/500</p>
        </CardContent>
      </Card>

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full sm:w-auto">
        {save.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>

      {/* OBS Overlay */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">📺 Overlay Streaming (OBS/Streamlabs)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Tambahkan sebagai Browser Source di OBS untuk menampilkan notifikasi donasi saat live streaming.</p>
          <div className="flex gap-2">
            <Input readOnly value={typeof window !== "undefined" ? `${window.location.origin}/overlay?id=${earnings?.user_id || ""}` : ""} className="text-xs" />
            <Button size="sm" variant="outline" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/overlay?id=${earnings?.user_id || ""}`);
              toast.success("URL overlay disalin!");
            }}>Copy</Button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Ukuran: 800×200px · Background transparan</p>
        </CardContent>
      </Card>
    </div>
  );
}
