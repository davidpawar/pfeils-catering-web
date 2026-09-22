import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { isBlogHeroImageKey } from "./utils/blogImages";

/**
 * Frontmatter every blog post must satisfy, in both languages.
 *
 * The build fails on an unknown `heroImageKey`, so a typo cannot reach
 * production as a missing hero image.
 */
const blogSchema = z
	.object({
		title: z.string(),
		description: z.string(),
		author: z.string().optional(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),

		/**
		 * Flat key of an image registered with `blogHero: true` in `imageProvider`.
		 */
		heroImageKey: z.string().optional(),
		lang: z.enum(["de", "en"]).optional(),

		/**
		 * Optional FAQ entries. Used only to emit FAQPage JSON-LD in the blog
		 * layout. The visible FAQ stays in the MDX body; keep both in sync.
		 * Use plain text (no Markdown) so the structured data is clean.
		 */
		faq: z
			.array(
				z.object({
					question: z.string(),
					answer: z.string(),
				}),
			)
			.optional(),
	})
	.superRefine((data, ctx) => {
		if (!data.heroImageKey) return;
		if (!isBlogHeroImageKey(data.heroImageKey)) {
			ctx.addIssue({
				code: "custom",
				message: `heroImageKey "${data.heroImageKey}" is not registered with blogHero: true in imageProvider`,
				path: ["heroImageKey"],
			});
		}
	});

/**
 * German blog posts from `src/content/blog/de/`.
 */
const blogDe = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "de/*.{md,mdx}" }),
	schema: blogSchema,
});

/**
 * English blog posts, same filenames as the German ones.
 */
const blogEn = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "en/*.{md,mdx}" }),
	schema: blogSchema,
});

/**
 * Collections Astro exposes to `getCollection()`.
 */
export const collections = { blogDe, blogEn };
