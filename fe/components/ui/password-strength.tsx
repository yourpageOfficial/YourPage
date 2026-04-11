"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const rules = [
  { label: "Minimal 8 karakter", test: (p: string) => p.length >= 8 },
  { label: "Huruf besar", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Angka", test: (p: string) => /\d/.test(p) },
  { label: "Simbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordStrength({ password }: { password: string }) {
  const passed = useMemo(() => rules.filter(r => r.test(password)).length, [password]);
  const strength = passed <= 1 ? "weak" : passed <= 2 ? "medium" : "strong";
  const colors = { weak: "bg-red-500", medium: "bg-yellow-500", strong: "bg-green-500" };

  if (!password) return null;

  return (
    <div aria-live="polite" className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < passed ? colors[strength] : "bg-primary-100 dark:bg-navy-800")} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {rules.map((r, i) => {
          const ok = r.test(password);
          return (
            <span key={i} className={cn("text-[11px] flex items-center gap-1", ok ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500")}>
              {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {r.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
