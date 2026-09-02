"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { Locale, TranslationDictionary } from "./types";
import { id } from "./id";
import { en } from "./en";

export const dictionaries: Record<Locale, TranslationDictionary> = { id, en };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDictionary;
  interpolate: (template: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "yp_locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && (saved === "id" || saved === "en")) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      } else {
        // Default to Indonesian, or detect browser
        const browserLang = navigator.language.toLowerCase();
        const initialLocale: Locale = browserLang.startsWith("id") ? "id" : "id"; // Default is ID
        setLocaleState(initialLocale);
        document.documentElement.lang = initialLocale;
      }
    } catch {
      // Fallback
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `${STORAGE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore in restricted environments
    }
  };

  const t = useMemo(() => dictionaries[locale] || dictionaries.id, [locale]);

  const interpolate = (template: string, params?: Record<string, string | number>): string => {
    if (!params) return template;
    return Object.entries(params).reduce((acc, [key, val]) => {
      return acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
    }, template);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, interpolate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for components rendered outside of provider
    return {
      locale: "id" as Locale,
      setLocale: () => {},
      t: dictionaries.id,
      interpolate: (template: string) => template,
    };
  }
  return context;
}

export const useLanguage = useTranslation;
