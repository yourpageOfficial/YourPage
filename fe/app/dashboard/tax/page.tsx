"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { Lock } from "lucide-react";
import Link from "next/link";

export default function TaxPage() {
  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data; } catch { return {}; } },
  });

  const isPro = earnings?.tier_name === "Pro" || earnings?.tier_name === "Business";

  if (!isPro) {
    return (
      <div className="text-center py-12">
        <Lock className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-lg font-bold mb-2">Laporan Pajak</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Fitur ini tersedia untuk tier Pro dan Business.</p>
        <Link href="/dashboard/subscription"><Button>Upgrade Sekarang</Button></Link>
      </div>
    );
  }

  const totalEarnings = earnings?.total_earnings || 0;
  const feePct = earnings?.fee_percent || 20;
  const grossEstimate = Math.round(totalEarnings / (1 - feePct / 100));
  const feeEstimate = grossEstimate - totalEarnings;

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-6">Laporan Pajak</h1>
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">Ringkasan Tahun 2026</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-gray-500 dark:text-gray-400">Gross Revenue</p><p className="text-lg font-bold">{formatIDR(grossEstimate)}</p></div>
            <div><p className="text-xs text-gray-500 dark:text-gray-400">Platform Fee ({feePct}%)</p><p className="text-lg font-bold text-red-500">-{formatIDR(feeEstimate)}</p></div>
            <div><p className="text-xs text-gray-500 dark:text-gray-400">Net Earnings</p><p className="text-lg font-bold text-green-600">{formatIDR(totalEarnings)}</p></div>
          </div>
          <p className="text-xs text-gray-400 mt-4">* Estimasi berdasarkan total earnings. Untuk laporan detail per transaksi, gunakan Export CSV di halaman Analitik.</p>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400">Catatan: YourPage tidak memotong pajak. Kreator bertanggung jawab atas pelaporan pajak masing-masing sesuai peraturan yang berlaku.</p>
    </div>
  );
}
