"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", JSON.stringify({ essential: true, analytics: true }));
    setShow(false);
  };

  const reject = () => {
    localStorage.setItem("cookie-consent", JSON.stringify({ essential: true, analytics: false }));
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-3 sm:p-4 bg-white dark:bg-navy-800 border-t dark:border-primary-900/30 shadow-xl"
        >
          <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
              Kami menggunakan cookies untuk meningkatkan pengalaman kamu. <a href="/privacy" className="text-primary hover:underline">Pelajari lebih lanjut</a>
            </p>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={reject} className="text-xs">Tolak</Button>
              <Button size="sm" onClick={accept} className="text-xs">Terima</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
