import type { ImageAsset } from "../provider/imageProvider";

/**
 * Resolves localized alt text for a registered image asset.
 *
 * German (`alt`) is the default. For English, returns `altEn` when present;
 * otherwise falls back to `alt`.
 *
 * @param image - Entry from `imageProvider`, e.g. `imageProvider.events.firmenfeier`.
 * @param lang - Locale code, typically `"de"` or `"en"`.
 * @returns Alt string for `<Image alt>` or `<img alt>`.
 */
export function getImageAlt(image: ImageAsset, lang: string): string {
  return lang === "en" && image.altEn ? image.altEn : image.alt;
}
