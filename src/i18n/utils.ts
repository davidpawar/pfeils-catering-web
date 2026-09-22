/**
 * i18n helpers for language detection and translated links.
 *
 * German is the default and has no URL prefix; English lives under `/en/` and
 * uses its own slugs (`/firmenfeier/` → `/en/corporate/`). The slug table is
 * `src/routing/routes.ts`.
 */

import { ui, defaultLang, showDefaultLang, routes } from "./translations";

/**
 * Reads the language from the URL path.
 *
 * German URLs have no prefix (`/firmenfeier/`), English ones start with the
 * locale (`/en/corporate/`).
 *
 * @param url - The current page URL.
 * @returns The language code, `"de"` or `"en"`.
 */
export function getLangFromUrl(url: URL): keyof typeof ui {
  const [, lang] = url.pathname.split("/");
  // the first segment is the locale when it matches a known language.
  if (lang && lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

/**
 * Returns the `t(key)` function for a language.
 *
 * Falls back to German when the English value is missing, so a page never
 * renders an empty string.
 *
 * @param lang - The language to translate into.
 * @returns A function that turns a key into the translated text.
 */
export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

/**
 * Builds localized hrefs: maps German slugs (firmenfeier → corporate) and
 * adds `/en/` for English. Pass the German path. Optional `l` overrides the language.
 */
export function useTranslatedPath(lang: keyof typeof ui) {
  return function translatePath(path: string, l: keyof typeof ui = lang) {
    const trailingSlash = path.endsWith("/");
    // keep inner slashes so nested keys match, for example "einsatzgebiete/koeln".
    const pathName = path.replace(/^\/|\/$/g, "");
    // only English has slug mappings; German URLs already use the canonical path.
    const routeForLang =
      l !== defaultLang && l in routes
        ? routes[l as keyof typeof routes]
        : undefined;
    const translatedSlug =
      routeForLang && pathName in routeForLang
        ? routeForLang[pathName as keyof typeof routeForLang]
        : undefined;
    const translatedPath = translatedSlug ? `/${translatedSlug}` : path;
    // the default language carries no /de/ prefix, because showDefaultLang is false.
    const result = !showDefaultLang && l === defaultLang
      ? translatedPath
      : `/${l}${translatedPath}`;
    // the mapping drops trailing slashes ("contact"); restore one if it was passed.
    return trailingSlash && !result.endsWith("/") ? result + "/" : result;
  };
}

/**
 * Turns the current URL back into its German canonical path.
 *
 * `LanguagePicker` and the `hreflang` tags in `BaseHead` use this so both
 * point at the same page in the other language.
 *
 * @param url - The current page URL.
 * @returns The German path, or `undefined` for the homepage and unknown routes.
 */
export function getRouteFromUrl(url: URL): string | undefined {
  const pathname = new URL(url).pathname;
  const parts = pathname.split("/").filter(Boolean);
  const currentLang = getLangFromUrl(url);
  // use the full path, so nested routes like einsatzgebiete/koeln survive.
  const path =
    currentLang === defaultLang
      ? (parts.join("/") ?? "")
      : (parts.slice(1).join("/") ?? "");

  if (path === "") {
    return undefined;
  }

  // blog slugs and pagination are identical in both languages, so keeping the
  // full path lets the picker stay on the current article while
  // useTranslatedPath only adds or removes the locale prefix.
  if (path === "blog" || path.startsWith("blog/")) {
    return path;
  }

  if (defaultLang === currentLang) {
    return path in routes.en ? path : undefined;
  }

  if (!(currentLang in routes)) return undefined;
  const routeForLang = routes[currentLang as keyof typeof routes];

  /**
   * Finds the German path whose translation equals `value`.
   *
   * @returns The matching key, or `undefined` when nothing matches.
   */
  const getKeyByValue = (
    obj: Record<string, string>,
    value: string,
  ): string | undefined => {
    return Object.keys(obj).find((key) => obj[key] === value);
  };

  // try the full path first ("service-areas/cologne"), then the first segment.
  return (
    getKeyByValue(routeForLang, path) ??
    getKeyByValue(routeForLang, path.split("/")[0] ?? path)
  );
}
