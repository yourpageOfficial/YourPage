"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 3rd visit
      const visits = parseInt(localStorage.getItem("visit-count") || "0") + 1;
      localStorage.setItem("visit-count", String(visits));
      if (visits >= 3) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("install-prompt-dismissed", String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-80 z-50 bg-white dark:bg-navy-800 border dark:border-primary-900/30 rounded-xl shadow-xl p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Install YourPage</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Akses lebih cepat langsung dari home screen</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={install} className="text-xs h-8">Install</Button>
            <Button size="sm" variant="ghost" onClick={dismiss} className="text-xs h-8">Nanti</Button>
          </div>
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
