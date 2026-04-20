"use client";

import { useLocale, type Locale } from "@/lib/use-locale";
import api from "@/lib/api";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useTranslation } from "@/lib/use-translation";
import { useState, useRef, useEffect } from "react";

const languages: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "id", label: "Bahasa Indonesia" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = async (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
    try {
      await api.put("/auth/me", { locale: newLocale });
    } catch {
      // Silently fail - locale is already persisted locally
    }
  };

  const currentLanguage = languages.find((l) => l.code === locale);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 flex items-center gap-2 rounded-xl hover:bg-primary-50 dark:hover:bg-navy-800 transition-colors"
        title={t("language.switch")}
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">{currentLanguage?.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-navy-900 rounded-xl shadow-lg border border-gray-100 dark:border-navy-700 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className="w-full h-10 px-3 flex items-center justify-between text-sm hover:bg-primary-50 dark:hover:bg-navy-800 transition-colors"
            >
              <span>{lang.label}</span>
              {locale === lang.code && <Check className="h-4 w-4 text-primary-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}