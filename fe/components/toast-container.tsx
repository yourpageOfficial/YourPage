"use client";

import { useToast } from "@/lib/toast";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

const icons = { success: CheckCircle, error: XCircle, info: Info };
const colors = {
  success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
  error: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
  info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
};

export function ToastContainer() {
  const { toasts, remove } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-3 sm:right-4 z-[100] flex flex-col gap-2 w-[calc(100%-1.5rem)] sm:w-80">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div key={t.id} className={`flex items-start gap-2 p-3 rounded-lg border shadow-lg animate-in slide-in-from-top-2 ${colors[t.type]}`}>
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="shrink-0 opacity-50 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
