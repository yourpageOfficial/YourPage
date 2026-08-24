import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  /** "inverted" forces white/translucent-white text — for use on dark or gradient section backgrounds, regardless of site theme. */
  tone?: "default" | "inverted";
  className?: string;
}

/** Shared bold section header used across landing, explore, and pricing pages. */
export function SectionHeading({ eyebrow, eyebrowIcon: EyebrowIcon, title, subtitle, align = "center", tone = "default", className }: SectionHeadingProps) {
  const inverted = tone === "inverted";
  return (
    <div className={cn("mb-12 sm:mb-16", align === "center" ? "text-center" : "text-left", className)}>
      {eyebrow && (
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wide mb-5",
            inverted
              ? "border-white/30 bg-white/10 text-white backdrop-blur-sm"
              : "border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
          )}
        >
          {EyebrowIcon && <EyebrowIcon className={cn("h-3.5 w-3.5", inverted ? "text-accent" : undefined)} aria-hidden="true" />}
          {eyebrow}
        </div>
      )}
      <h2 className={cn("text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight leading-[1.1]", inverted && "text-white")}>{title}</h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base sm:text-lg leading-relaxed",
            inverted ? "text-white/80" : "text-gray-600 dark:text-gray-400",
            align === "center" && "max-w-2xl mx-auto"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
