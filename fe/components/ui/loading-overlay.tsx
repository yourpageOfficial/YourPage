"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  progress?: number;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ progress, message, className }: LoadingOverlayProps) {
  return (
    <div className={cn("fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm bg-black/50", className)}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4 min-w-[200px]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        {progress !== undefined && (
          <div className="w-full space-y-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              {message || `${Math.round(progress)}%`}
            </p>
          </div>
        )}
        {!progress && message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}
