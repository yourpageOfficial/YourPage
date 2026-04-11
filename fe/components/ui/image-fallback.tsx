"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackClassName?: string;
}

export function ImageFallback({ className, fallbackClassName, alt, ...props }: ImageFallbackProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  if (status === "error") {
    return (
      <div className={cn("flex items-center justify-center bg-primary-50 dark:bg-navy-800 rounded-xl", fallbackClassName || className)}>
        <ImageOff className="h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      {status === "loading" && <Skeleton className={cn("absolute inset-0", className)} />}
      <Image
        className={cn(status === "loading" && "opacity-0", className)}
        alt={alt}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        {...props}
      />
    </div>
  );
}
