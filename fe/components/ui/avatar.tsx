"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const sizeMap = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-12 w-12 text-sm", xl: "h-16 w-16 text-base" } as const;

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: keyof typeof sizeMap;
  online?: boolean;
  className?: string;
}

export function Avatar({ src, alt, name, size = "md", online, className }: AvatarProps) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div className="relative inline-flex shrink-0">
      <AvatarPrimitive.Root className={cn("relative flex shrink-0 overflow-hidden rounded-full", sizeMap[size], className)}>
        <AvatarPrimitive.Image src={src || undefined} alt={alt || name || ""} className="aspect-square h-full w-full object-cover" />
        <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
          {initials}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {online && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />}
    </div>
  );
}
