import { cn } from "@/lib/utils";

export function CharacterCount({ current, max, className }: { current: number; max: number; className?: string }) {
  const pct = current / max;
  return (
    <span aria-live="polite" className={cn(
      "text-xs tabular-nums",
      pct >= 1 ? "text-red-500" : pct >= 0.9 ? "text-yellow-600 dark:text-yellow-400" : "text-gray-400 dark:text-gray-500",
      className
    )}>
      {current}/{max}
    </span>
  );
}
