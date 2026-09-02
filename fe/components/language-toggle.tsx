"use client";

import { useTranslation } from "@/lib/internationalization";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  const toggle = () => {
    setLocale(locale === "id" ? "en" : "id");
  };

  return (
    <button
      onClick={toggle}
      className="h-8 sm:h-9 px-2.5 flex items-center gap-1.5 rounded-xl hover:bg-primary-50 dark:hover:bg-navy-800 transition-colors text-xs font-bold text-gray-700 dark:text-gray-300 border border-primary-100 dark:border-primary-900/30 cursor-pointer"
      title={locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      <span className="uppercase tracking-wider">{locale}</span>
    </button>
  );
}
