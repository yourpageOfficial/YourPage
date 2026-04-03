import { cn } from "@/lib/utils";

function Badge({ className, variant, children }: { className?: string; variant?: "outline"; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      variant === "outline" ? "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300" : "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300",
      className
    )}>
      {children}
    </span>
  );
}

export { Badge };
