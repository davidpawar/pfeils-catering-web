import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../seo/consts";

/**
 * Serves the German blog feed at `/rss.xml`.
 *
 * Only German posts are listed. The English blog has no feed of its own.
 */
export async function GET(context) {

	/**
	 * Newest post first, the order a feed reader expects.
	 */
	const posts = (await getCollection("blogDe")).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);

	/**
	 * Strips the collection folder from the id, so "de/foo" becomes "foo".
	 */
	const slug = (id) => id.replace(/^de\//, "");

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${slug(post.id)}/`,
		})),
	});
}
