import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blogSchema = z.object({
	title: z.string(),
	description: z.string(),
	author: z.string().optional(),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	heroImage: z.string().optional(),
	lang: z.enum(["de", "en"]).optional(),
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
