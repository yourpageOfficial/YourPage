import { useLocale, type Locale } from "./use-locale";
import idMessages from "../messages/id.json";
import enMessages from "../messages/en.json";

type Messages = typeof idMessages;

const messages: Record<Locale, Messages> = {
  id: idMessages,
  en: enMessages,
};

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let result: unknown = obj;
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof result === "string" ? result : undefined;
}

function interpolate(text: string, params: string[]): string {
  return params.reduce((acc, param, index) => {
    return acc.replace(new RegExp(`\\{${index}\\}`, "g"), param);
  }, text);
}

export function useTranslation() {
  const locale = useLocale((state) => state.locale);

  const t = (key: string, ...params: string[]): string => {
    const translated = getNestedValue(messages[locale] as unknown as Record<string, unknown>, key);
    if (!translated) {
      console.warn(`Missing translation: ${key} for locale ${locale}`);
      return key;
    }
    return params.length > 0 ? interpolate(translated, params) : translated;
  };

  return { t, locale };
}

export function useCurrentLocale() {
  return useLocale((state) => state.locale);
}