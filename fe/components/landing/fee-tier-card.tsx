import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/utils";

interface FeeTierCardProps {
  tier: string;
  takeHomePercent: number;
  feePercent: number;
  exampleBase?: number;
  highlight?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Visualizes what a creator actually keeps per tier — the core "earnings transparency"
 * element requested for the redesign. Reused on the landing page's dedicated section.
 */
export function FeeTierCard({ tier, takeHomePercent, feePercent, exampleBase = 100000, highlight, compact, className }: FeeTierCardProps) {
  const exampleTakeHome = Math.round((exampleBase * takeHomePercent) / 100);
  return (
    <div
      className={cn(
        "rounded-3xl p-6 sm:p-7 border-2 transition-colors",
        highlight
          ? "bg-navy-900 dark:bg-navy-950 border-accent text-white shadow-glow-accent"
          : "bg-white dark:bg-navy-800 border-primary-100 dark:border-white/10 shadow-card",
        className
      )}
    >
      <p className={cn("text-xs font-bold uppercase tracking-widest", highlight ? "text-accent-400" : "text-primary")}>{tier}</p>
      <p className="mt-2 font-display font-black text-5xl sm:text-6xl tracking-tight">{takeHomePercent}%</p>
      <p className={cn("text-sm font-medium mt-1", highlight ? "text-white/70" : "text-gray-600 dark:text-gray-400")}>kamu terima dari tiap transaksi</p>

      <div className={cn("h-3 rounded-full mt-5 overflow-hidden flex", highlight ? "bg-white/10" : "bg-primary-50 dark:bg-navy-900")} role="presentation">
        <div className={highlight ? "bg-accent h-full rounded-full" : "bg-primary h-full rounded-full"} style={{ width: `${takeHomePercent}%` }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[11px] font-medium">
        <span className={highlight ? "text-white/60" : "text-gray-500 dark:text-gray-400"}>Kamu {takeHomePercent}%</span>
        <span className={highlight ? "text-white/40" : "text-gray-400 dark:text-gray-500"}>Fee platform {feePercent}%</span>
      </div>

      {!compact && (
        <p className={cn("mt-5 text-sm rounded-xl px-3.5 py-2.5 leading-relaxed", highlight ? "bg-white/10 text-white/90" : "bg-primary-50 dark:bg-primary-900/20 text-gray-700 dark:text-gray-300")}>
          Contoh: donasi {formatIDR(exampleBase)} masuk → kamu terima <strong>{formatIDR(exampleTakeHome)}</strong>
        </p>
      )}
    </div>
  );
}
