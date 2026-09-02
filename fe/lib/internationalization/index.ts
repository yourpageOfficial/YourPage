export * from "./types";
export * from "./context";
export { id } from "./id";
export { en } from "./en";
import { id } from "./id";
import { en } from "./en";
import type { Locale, TranslationDictionary } from "./types";

export const dictionaries: Record<Locale, TranslationDictionary> = { id, en };

export function getTranslation(locale: Locale = "id"): TranslationDictionary {
  return dictionaries[locale] || dictionaries.id;
}
