/**
 * i18n Utility Functions
 *
 * Helper functions for internationalization (i18n) following the Astro i18n Recipe.
 * Supports translated routes (e.g. /firmenfeier → /en/corporate) and hiding the
 * default language in the URL.
 */

import { ui, defaultLang, showDefaultLang, routes, canonicalPaths } from "./translations";

/**
 * Determines the current language from the URL path.
 * For default language (DE): URLs have no prefix, e.g. /firmenfeier/
 * For other languages (EN): URLs have prefix, e.g. /en/corporate/
 *
 * @param url - The current page URL
 * @returns The language code (e.g. "de" | "en")
 */
export function getLangFromUrl(url: URL): keyof typeof ui {
  const [, lang] = url.pathname.split("/");
  // First path segment is locale if it matches a known language
  if (lang && lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

/**
 * Returns a translation function for the given language.
 * Falls back to default language if a key is missing in the target language.
 *
 * @param lang - The language to translate to
 * @returns A function t(key) that returns the translated string
 */
export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

/**
 * Returns a function that translates a path for a given language.
 * Applies route mappings (e.g. firmenfeier → corporate for EN) and
 * optionally adds the locale prefix (e.g. /en/) for non-default languages.
 *
 * @param lang - The target language for the path
 * @returns A function translatePath(path, l?) that returns the localized URL
 */
export function useTranslatedPath(lang: keyof typeof ui) {
  return function translatePath(path: string, l: keyof typeof ui = lang) {
    const trailingSlash = path.endsWith("/");
    const pathName = path.replaceAll("/", "");
    const routeForLang = routes[l as keyof typeof routes];
    // Check if this path has a translated slug for the target language
    const hasTranslation =
      defaultLang !== l &&
      routeForLang !== undefined &&
      pathName &&
      pathName in routeForLang;
    const translatedPath = hasTranslation
      ? "/" + (routeForLang as Record<string, string>)[pathName]
      : path;
    // Default language: no prefix (showDefaultLang = false)
    const result = !showDefaultLang && l === defaultLang
      ? translatedPath
      : `/${l}${translatedPath}`;
    return trailingSlash && !result.endsWith("/") ? result + "/" : result;
  };
}

/**
 * Extracts the canonical route key from the current URL.
 * Used by LanguagePicker to build links to the same page in other languages.
 *
 * For default language: returns path if it exists in routes (e.g. "firmenfeier")
 * For other languages: reverse-lookup to get default-language path (e.g. "corporate" → "firmenfeier")
 *
 * @param url - The current page URL
 * @returns The canonical route key, or undefined for home/unknown routes
 */
export function getRouteFromUrl(url: URL): string | undefined {
  const pathname = new URL(url).pathname;
  const parts = pathname.split("/").filter(Boolean);
  const currentLang = getLangFromUrl(url);
  // Full path: for nested routes (e.g. einsatzgebiete/koeln)
  const path =
    currentLang === defaultLang
      ? (parts.join("/") ?? "")
      : (parts.slice(1).join("/") ?? "");

  if (path === "") {
    return undefined;
  }

  if (defaultLang === currentLang) {
    // Path is DE path; check flattened form in route mappings
    const route = Object.values(routes)[0] as Record<string, string>;
    const pathNormalized = path.replaceAll("/", "");
    const existsInRoute = pathNormalized in route;
    // Return path with slashes for translatePath (use canonicalPaths if available)
    return existsInRoute
      ? (canonicalPaths[pathNormalized] ?? path)
      : undefined;
  }

  const routeForLang = routes[currentLang as keyof typeof routes];
  if (!routeForLang) return undefined;

  // Reverse lookup: find the key whose value matches the current path (full path or first segment)
  const getKeyByValue = (
    obj: Record<string, string>,
    value: string,
  ): string | undefined => {
    return Object.keys(obj).find((key) => obj[key] === value);
  };

  // Try full path first (e.g. "service-areas/cologne"), then first segment
  const reversedKey =
    getKeyByValue(routeForLang as Record<string, string>, path) ??
    getKeyByValue(routeForLang as Record<string, string>, path.split("/")[0] ?? path);

  return reversedKey ? (canonicalPaths[reversedKey] ?? reversedKey) : undefined;
}
