"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 left-4 z-50 md:hidden h-11 w-11 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn(
        "shrink-0 border-r min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 dark:border-gray-700 z-40",
        "md:block md:relative md:w-56",
        open ? "fixed left-0 top-14 sm:top-16 w-64 shadow-xl block overflow-y-auto max-h-[calc(100vh-3.5rem)]" : "hidden"
      )}>
        <div className="p-3 sm:p-4" onClick={() => setOpen(false)}>
          {children}
        </div>
      </aside>
    </>
  );
}
