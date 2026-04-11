import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step { label: string; }

export function StepIndicator({ steps, current, className }: { steps: Step[]; current: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0", className)} role="list">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-initial" role="listitem" aria-current={i === current ? "step" : undefined}>
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
              i < current ? "bg-primary border-primary text-white" : i === current ? "border-primary text-primary bg-primary-50 dark:bg-primary-900/20" : "border-primary-200 dark:border-primary-900/40 text-gray-400 dark:text-gray-500"
            )}>
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn("text-[10px] sm:text-xs font-medium text-center max-w-[60px] sm:max-w-none", i <= current ? "text-primary" : "text-gray-400 dark:text-gray-500")}>{step.label}</span>
          </div>
          {i < steps.length - 1 && <div className={cn("flex-1 h-0.5 mx-2 mt-[-16px]", i < current ? "bg-primary" : "bg-primary-100 dark:bg-navy-800")} />}
        </div>
      ))}
    </div>
  );
}
