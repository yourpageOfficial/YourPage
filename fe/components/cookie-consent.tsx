"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/internationalization";

export function CookieConsent() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setShow(true);
  }, []);

  // Fixed CTAs (e.g. the donate button) sit lower on the screen than this
  // banner. Flag its presence so they can shift up rather than end up
  // unclickable behind it.
  useEffect(() => {
    document.body.dataset.cookieBanner = show ? "1" : "";
    return () => { document.body.dataset.cookieBanner = ""; };
  }, [show]);

  if (pathname.startsWith("/overlay")) return null;

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
              {t.compAccount.cookieMessage} <a href="/privacy" className="text-primary hover:underline">{t.compAccount.cookieLearnMore}</a>
            </p>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={reject} className="text-xs">{t.compAccount.cookieReject}</Button>
              <Button size="sm" onClick={accept} className="text-xs">{t.compAccount.cookieAccept}</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
