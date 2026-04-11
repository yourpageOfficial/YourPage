import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300",
        secondary: "bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300",
        outline: "border-2 border-primary-200 dark:border-primary-800 text-gray-700 dark:text-gray-300",
        success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
        destructive: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
        warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
        pro: "bg-gradient-to-r from-primary-400 to-primary-500 text-white font-bold shadow-sm",
        business: "bg-gradient-to-r from-secondary-500 to-secondary-700 text-white font-bold shadow-sm",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
