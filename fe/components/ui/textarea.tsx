import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, showCount, maxLength, value, ...props }, ref) => {
  const id = React.useId();
  const errorId = error ? `${id}-error` : undefined;
  const len = typeof value === "string" ? value.length : 0;
  return (
    <div className="w-full">
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border bg-white dark:bg-navy-800 px-4 py-3 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 transition-all resize-y",
          error ? "border-red-400 focus:ring-red-500" : "border-primary-200 dark:border-primary-900/40 focus:ring-primary",
          className
        )}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={errorId}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      <div className="flex justify-between mt-1">
        {error ? <p id={errorId} className="text-xs text-red-500">{error}</p> : <span />}
        {showCount && maxLength && <p className="text-xs text-gray-400">{len}/{maxLength}</p>}
      </div>
    </div>
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
