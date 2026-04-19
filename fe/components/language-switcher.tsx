"use client";

import { useLocale, type Locale } from "@/lib/use-locale";
import api from "@/lib/api";
import { Globe } from "lucide-react";
import { useTranslation } from "@/lib/use-translation";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();

  const handleChange = async (newLocale: Locale) => {
    setLocale(newLocale);
    try {
      await api.put("/auth/me", { locale: newLocale });
    } catch {
      // Silently fail - locale is already persisted locally
    }
  };

  return (
    <button
      onClick={() => handleChange(locale === "id" ? "en" : "id")}
      className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-primary-50 dark:hover:bg-navy-800 transition-colors"
      title={locale === "id" ? t("language.switch_to_english") : t("language.switch_to_indonesian")}
    >
      <Globe className="h-4 w-4" />
    </button>
  );
}