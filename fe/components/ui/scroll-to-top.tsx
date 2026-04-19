"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/use-translation";

export function ScrollToTop() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t("common.scroll_to_top")}
      className={cn(
        "fixed bottom-20 sm:bottom-8 right-4 z-40 h-10 w-10 rounded-full bg-primary text-white shadow-lg",
        "flex items-center justify-center hover:bg-primary-700 transition-all animate-fade-in",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
