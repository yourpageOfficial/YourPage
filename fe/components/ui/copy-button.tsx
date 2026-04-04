"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  label?: string;
}

export function CopyButton({ value, className, variant = "outline", size = "icon", label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn("transition-all", className)}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {label && <span className="ml-2">{label}</span>}
    </Button>
  );
}
