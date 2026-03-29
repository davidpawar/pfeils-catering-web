import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";
import { imageProvider } from "./provider/imageProvider";

function isBlogHeroImageKey(key: string): boolean {
	return key in imageProvider.catering || key in imageProvider.cocktails;
}

const blogSchema = z
	.object({
		title: z.string(),
		description: z.string(),
		author: z.string().optional(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		/** Key in `imageProvider.catering` or `imageProvider.cocktails`. */
		heroImageKey: z.string().optional(),
		lang: z.enum(["de", "en"]).optional(),
	})
	.superRefine((data, ctx) => {
		if (!data.heroImageKey) return;
		if (!isBlogHeroImageKey(data.heroImageKey)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `heroImageKey "${data.heroImageKey}" not found in imageProvider.catering or imageProvider.cocktails`,
				path: ["heroImageKey"],
			});
		}
	});

const blogDe = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "de/*.{md,mdx}" }),
	schema: blogSchema,
});

const blogEn = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "en/*.{md,mdx}" }),
	schema: blogSchema,
});

export const collections = { blogDe, blogEn };
