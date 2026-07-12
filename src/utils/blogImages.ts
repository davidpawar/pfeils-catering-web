import { imageProvider, type ImageAsset } from "../provider/imageProvider";

/**
 * Builds a flat lookup of images marked with `blogHero: true` in `imageProvider`.
 *
 * Keys must be unique across all categories; duplicate keys throw at module load.
 */
function buildBlogHeroIndex(): Readonly<Record<string, ImageAsset>> {
  const index: Record<string, ImageAsset> = {};

  for (const category of Object.values(imageProvider)) {
    for (const [key, asset] of Object.entries(category)) {
      if (!asset.blogHero) continue;

      if (key in index) {
        throw new Error(
          `Duplicate blog hero image key "${key}" in imageProvider`,
        );
      }

      index[key] = asset;
    }
  }

  return index;
}

const blogHeroImages = buildBlogHeroIndex();

/**
 * Checks whether a key refers to an image registered as a blog hero.
 *
 * Used by the content collection schema to fail the build on unknown keys.
 *
 * @param key - Flat key name, e.g. `"firmenfeierFullSetup"`.
 * @returns `true` when the key is registered with `blogHero: true`.
 */
export function isBlogHeroImageKey(key: string): boolean {
  return key in blogHeroImages;
}

/**
 * Looks up a blog hero image by its flat key name.
 *
 * @param key - Flat key from blog frontmatter `heroImageKey`.
 * @returns Matching `ImageAsset`, or `undefined` if the key is not found.
 */
export function getBlogHeroImage(key: string): ImageAsset | undefined {
  return blogHeroImages[key];
}

/**
 * Maps a content collection blog entry to the shape expected by `BlogPostList`.
 *
 * Resolves optional `heroImageKey` frontmatter to a full `ImageAsset` and
 * strips the locale prefix from the collection entry id to produce the URL slug.
 *
 * @param post - Blog entry from `getCollection("blogDe")` or `"blogEn"`.
 * @param localePrefix - Collection locale folder, `"de"` or `"en"`.
 * @returns List item with `slug`, metadata, and optional resolved hero image.
 */
export function toBlogPostListItem(
  post: {
    data: {
      description: string;
      heroImageKey?: string;
      pubDate: Date;
      title: string;
    };
    id: string;
  },
  localePrefix: "de" | "en",
) {
  return {
    description: post.data.description,
    heroImage: post.data.heroImageKey
      ? getBlogHeroImage(post.data.heroImageKey)
      : undefined,
    id: post.id,
    pubDate: post.data.pubDate,
    slug: post.id.replace(new RegExp(`^${localePrefix}/`), ""),
    title: post.data.title,
  };
}
