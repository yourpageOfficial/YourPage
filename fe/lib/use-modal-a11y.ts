"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// ponytail: focus management loop for modal dialogs. Native <dialog> gives this
// free, but callers render custom markup; a shared trap keeps every dialog
// accessible without refactoring all callers onto <dialog>. Upstream to <dialog>
// if it ever becomes safe to migrate wholesale.
export function useModalA11y(isOpen: boolean, close: () => void, panelRef: React.RefObject<HTMLElement | null>) {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const panel = panelRef.current;
      if (!panel) return;
      (panel.querySelector(FOCUSABLE) as HTMLElement | undefined)?.focus() ?? panel.focus();
    };
    focusFirst();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const els = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (els.length === 0) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [isOpen, close, panelRef]);
}
