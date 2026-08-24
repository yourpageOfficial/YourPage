import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  icon: LucideIcon;
  value: string;
  label: string;
  tone?: "primary" | "accent" | "secondary";
  className?: string;
}

const toneClasses: Record<NonNullable<StatTileProps["tone"]>, string> = {
  primary: "bg-primary-50 dark:bg-primary-900/20 text-primary dark:text-primary-300",
  accent: "bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400",
  secondary: "bg-secondary-50 dark:bg-secondary-500/15 text-secondary dark:text-secondary-300",
};

/** Bold stat/number tile — used in the landing page trust strip. */
export function StatTile({ icon: Icon, value, label, tone = "primary", className }: StatTileProps) {
  return (
    <div className={cn("rounded-2xl border border-primary-100 dark:border-primary-900/20 bg-white dark:bg-navy-800 shadow-card p-4 sm:p-5 text-center", className)}>
      <div className={cn("mx-auto h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center mb-2.5", toneClasses[tone])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-2xl sm:text-3xl font-display font-black tracking-tight">{value}</p>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
