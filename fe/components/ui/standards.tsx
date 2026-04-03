import * as React from "react";
import { cn } from "@/lib/utils";

// Standard form field wrapper with label
export function FormField({ label, hint, error, children, className }: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Standard input classes — use this everywhere
export const inputClass = "flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 transition-colors";

export const textareaClass = cn(inputClass, "min-h-[80px] resize-y py-2");

export const selectClass = cn(inputClass, "appearance-none cursor-pointer");

// Standard section spacing
export const sectionClass = "space-y-3 sm:space-y-4";

// Standard page title
export function PageTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
      <h1 className="text-xl sm:text-2xl font-bold">{children}</h1>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Standard status colors — use everywhere
export const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  paid: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  approved: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  processed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  failed: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  rejected: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  expired: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400",
  refunded: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  resolved: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  dismissed: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400",
  draft: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400",
  published: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  free: "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300",
};

// Alias for backward compat
export const statusColor = statusColors;

// Standard role colors
export const roleColors: Record<string, string> = {
  admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  creator: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  supporter: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400",
};

// Standard empty state
export function EmptyState({ icon: Icon, title, action }: { icon: any; title: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// Standard info row for detail views
export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

// Standard detail card section
export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t dark:border-gray-700 pt-3 mt-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{title}</p>
      {children}
    </div>
  );
}
