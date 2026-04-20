"use client";

import { useToast } from "@/lib/toast";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/use-translation";

const icons = { success: CheckCircle, error: XCircle, info: Info };
const colors = {
  success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
  error: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
  info: "bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
};

export function ToastContainer() {
  const { t } = useTranslation();
  const { toasts, remove } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div aria-live="polite" className="fixed top-16 right-3 sm:right-4 z-[100] flex flex-col gap-2 w-[calc(100%-1.5rem)] sm:w-80">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div key={toast.id} className={`flex items-start gap-2 p-3 rounded-xl border shadow-lg animate-in slide-in-from-top-2 ${colors[toast.type]}`}>
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{toast.message}</p>
              {toast.action && <Button variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs" onClick={toast.action.onClick}>{toast.action.label}</Button>}
            </div>
            <button onClick={() => remove(toast.id)} className="shrink-0 opacity-50 hover:opacity-100" aria-label={t("common.close_toast")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
