import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

const variants = {
  error: { bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40", icon: AlertCircle, iconColor: "text-red-500" },
  success: { bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40", icon: CheckCircle, iconColor: "text-green-500" },
  warning: { bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40", icon: AlertTriangle, iconColor: "text-amber-500" },
  info: { bg: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-blue-800/40", icon: Info, iconColor: "text-blue-500" },
};

export function Alert({ variant = "info", children, className }: { variant?: keyof typeof variants; children: React.ReactNode; className?: string }) {
  const v = variants[variant];
  const Icon = v.icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-4 text-sm", v.bg, className)} role="alert">
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", v.iconColor)} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
