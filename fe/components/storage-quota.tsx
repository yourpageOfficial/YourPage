"use client";

import Link from "next/link";
import { Crown, HardDrive, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const TIER_ICONS: Record<string, typeof Crown> = {
  Business: Crown,
  Pro: Zap,
};

const TIER_BADGE_VARIANT: Record<string, "business" | "pro" | "outline"> = {
  Business: "business",
  Pro: "pro",
};

/** Formats a byte count as an Indonesian-locale human string, e.g. 2576980377 -> "2,4 GB". */
function formatBytes(bytes: number): string {
  const safe = Math.max(bytes, 0);
  if (safe === 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(safe) / Math.log(1024)), units.length - 1);
  const value = safe / Math.pow(1024, exponent);
  const maximumFractionDigits = exponent > 0 && value < 10 ? 1 : 0;
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(value)} ${units[exponent]}`;
}

export interface StorageQuotaProps {
  usedBytes: number;
  quotaBytes: number;
  tierName?: string;
  className?: string;
}

/** Creator dashboard card showing storage usage against the tier quota, with upgrade CTA near the limit. */
export function StorageQuota({ usedBytes, quotaBytes, tierName, className }: StorageQuotaProps) {
  const safeUsed = Math.max(usedBytes || 0, 0);
  const safeQuota = Math.max(quotaBytes || 0, 0);
  const pct = safeQuota > 0 ? Math.min((safeUsed / safeQuota) * 100, 100) : 0;
  const roundedPct = Math.round(pct);

  const level: "normal" | "warning" | "error" = pct > 90 ? "error" : pct > 75 ? "warning" : "normal";

  const barColor = {
    normal: "bg-primary dark:bg-primary-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    error: "bg-error dark:bg-red-400",
  }[level];

  const textColor = {
    normal: "text-primary dark:text-primary-400",
    warning: "text-amber-600 dark:text-amber-400",
    error: "text-error dark:text-red-400",
  }[level];

  const label = tierName || "Free";
  const TierIcon = TIER_ICONS[label] || Sparkles;
  const badgeVariant = TIER_BADGE_VARIANT[label] || "outline";

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
            <HardDrive className="h-4 w-4 text-primary dark:text-primary-400" />
          </div>
          <p className="text-sm font-bold">Penyimpanan</p>
        </div>
        <Badge variant={badgeVariant} className="gap-1 shrink-0">
          <TierIcon className="h-3 w-3" /> {label}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className={cn("font-bold", textColor)}>{formatBytes(safeUsed)}</span> dari {formatBytes(safeQuota)} terpakai
          </p>
          <span className={cn("text-xs font-bold shrink-0", textColor)}>{roundedPct}%</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={roundedPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Penyimpanan terpakai: ${roundedPct} persen dari ${formatBytes(safeQuota)}`}
          className="w-full h-2.5 bg-primary-100 dark:bg-navy-800 rounded-full overflow-hidden"
        >
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>

        {level === "error" && (
          <Alert variant="error" className="mt-4">
            <p className="font-medium">Penyimpanan hampir penuh ({roundedPct}%).</p>
            <p className="text-xs mt-0.5 text-gray-600 dark:text-gray-300">Upgrade paket untuk menambah kapasitas penyimpanan kamu.</p>
            <Link href="/dashboard/subscription">
              <Button size="sm" variant="destructive" className="mt-2.5 h-8 text-xs">Upgrade Paket</Button>
            </Link>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
