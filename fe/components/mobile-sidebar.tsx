"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 left-4 z-50 md:hidden h-12 w-12 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-all hover:shadow-xl hover:shadow-primary/40"
        aria-label={open ? "Tutup sidebar" : "Buka sidebar"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && <div className="fixed inset-0 z-40 bg-navy-900/40 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "shrink-0 border-r border-primary-100 dark:border-primary-900/30 min-h-[calc(100vh-4rem)] bg-white dark:bg-navy-900 z-40",
          "md:block md:relative md:w-56",
          open ? "fixed left-0 top-16 w-64 shadow-elevated block overflow-y-auto max-h-[calc(100vh-4rem)] animate-slide-up" : "hidden"
        )}
        role="dialog"
        aria-modal={open ? "true" : undefined}
      >
        <div className="p-3 sm:p-4" onClick={() => setOpen(false)}>
          {children}
        </div>
      </aside>
    </>
  );
}
