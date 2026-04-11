import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error, success, iconLeft, iconRight, ...props }, ref) => {
  const id = React.useId();
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="w-full">
      <div className="relative">
        {iconLeft && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{iconLeft}</span>}
        <input
          className={cn(
            "flex h-11 w-full rounded-xl border bg-white dark:bg-navy-800 px-4 py-2.5 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 transition-all",
            error ? "border-red-400 focus:ring-red-500" : success ? "border-emerald-400 focus:ring-emerald-500" : "border-primary-200 dark:border-primary-900/40 focus:ring-primary",
            iconLeft && "pl-10",
            iconRight && "pr-10",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        />
        {iconRight && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">{iconRight}</span>}
      </div>
      {error && <p id={errorId} className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

export { Input };
