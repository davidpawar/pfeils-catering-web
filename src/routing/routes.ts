/**
 * Every marketing route: German path to English path, slashes kept.
 *
 * The key is the German URL and also the file path under `src/views/`, so
 * `einsatzgebiete/koeln` is `/einsatzgebiete/koeln/` and
 * `src/views/einsatzgebiete/koeln.astro`. The value is the English path
 * without the `/en/` prefix.
 *
 * This module imports nothing on purpose. The i18n helpers read it, and the
 * views read the i18n helpers. Importing a view here would close that loop and
 * break the build.
 */
export const pagePaths = {
  anfrage: "contact",
  datenschutz: "privacy",
  "einsatzgebiete/gummersbach": "service-areas/gummersbach",
  "einsatzgebiete/koeln": "service-areas/cologne",
  "einsatzgebiete/nuembrecht": "service-areas/nuembrecht",
  firmenfeier: "corporate",
  hochzeitsfeier: "wedding",
  impressum: "imprint",
  "individuelles-catering": "individual-catering",
  "messe-catering": "exhibition",
  "mobile-cocktailbar": "mobile-cocktail-bar",
} as const;

/**
 * Paths that are identical in both languages and only get the `/en/` prefix.
 *
 * Blog articles are MDX with their own page files, so they have no view.
 */
export const sharedPaths = {
  blog: "blog",
} as const;

/**
 * Path lookup per language, used by `useTranslatedPath` and `getRouteFromUrl`.
 */
export const routes = {
  en: { ...pagePaths, ...sharedPaths },
} as const;
