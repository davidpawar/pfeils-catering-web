import type { APIRoute } from "astro";

/**
 * Rendered per request, because the answer depends on the host.
 */
export const prerender = false;

/**
 * Hosts that must not be indexed, so staging never competes with production.
 */
const NO_INDEX_HOSTS = new Set(["localhost", "dev.pfeils-catering.de"]);

/**
 * Serves `/robots.txt`.
 *
 * Production allows crawling and points at the sitemap. Local and staging
 * hosts disallow everything, which is why local Lighthouse SEO scores are low.
 */
export const GET: APIRoute = ({ request, site }) => {
  const { hostname } = new URL(request.url);
  const shouldNoIndex = NO_INDEX_HOSTS.has(hostname.toLowerCase());
  const sitemapUrl = new URL("/sitemap-index.xml", site ?? request.url);

  const body = shouldNoIndex
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl.href}\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
