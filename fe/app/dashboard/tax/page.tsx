"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/internationalization";

export default function TaxPage() {
  const { t, interpolate } = useTranslation();
  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data; } catch { return {}; } },
  });

  const isPro = earnings?.tier_name === "Pro" || earnings?.tier_name === "Business";

  if (!isPro) {
    return (
      <div className="text-center py-12">
        <Lock className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-lg font-bold mb-2">{t.accountMgr.taxTitle}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.accountMgr.taxLockedDesc}</p>
        <Link href="/dashboard/subscription"><Button>{t.accountMgr.taxUpgradeNow}</Button></Link>
      </div>
    );
  }

  const totalEarnings = earnings?.total_earnings || 0;
  const feePct = earnings?.fee_percent || 20;
  const grossEstimate = Math.round(totalEarnings / (1 - feePct / 100));
  const feeEstimate = grossEstimate - totalEarnings;

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-6">{t.accountMgr.taxTitle}</h1>
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">{t.accountMgr.taxSummaryTitle}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-gray-500 dark:text-gray-400">{t.accountMgr.taxGrossRevenue}</p><p className="text-lg font-bold">{formatIDR(grossEstimate)}</p></div>
            <div><p className="text-xs text-gray-500 dark:text-gray-400">{interpolate(t.accountMgr.taxPlatformFee, { fee: feePct })}</p><p className="text-lg font-bold text-red-500">-{formatIDR(feeEstimate)}</p></div>
            <div><p className="text-xs text-gray-500 dark:text-gray-400">{t.accountMgr.taxNetEarnings}</p><p className="text-lg font-bold text-green-600">{formatIDR(totalEarnings)}</p></div>
          </div>
          <p className="text-xs text-gray-400 mt-4">{t.accountMgr.taxEstimationNote}</p>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400">{t.accountMgr.taxDisclaimer}</p>
    </div>
  );
}
