"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onFocus={() => setShow(true)} onBlur={() => setShow(false)}>
      {children}
      {show && (
        <div role="tooltip" className={cn(
          "absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-navy-900 dark:bg-navy-100 dark:text-gray-900 rounded-xl shadow-lg whitespace-nowrap animate-fade-in pointer-events-none",
          side === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-1.5" : "top-full left-1/2 -translate-x-1/2 mt-1.5",
          className
        )}>
          {content}
        </div>
      )}
    </div>
  );
}
