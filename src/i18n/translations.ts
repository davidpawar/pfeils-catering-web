import { de } from "./translations/de";
import { en } from "./translations/en";

/**
 * Re-exported so i18n consumers have one import for locales and paths.
 */
export { routes } from "../routing/routes";

/**
 * Supported languages with the label the language picker shows.
 */
export const languages = { de: "Deutsch", en: "English" } as const;

/**
 * German is canonical: copy is written here first and English mirrors it.
 */
export const defaultLang = "de";

/**
 * German URLs carry no `/de/` prefix; only English uses `/en/`.
 */
export const showDefaultLang = false;

/**
 * All copy per language. `useTranslations` reads from this.
 */
export const ui = {
  de,
  en,
} as const;
