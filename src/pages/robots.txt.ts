import type { APIRoute } from "astro";

export const prerender = false;

// Hosts that should not be indexed.
const NO_INDEX_HOSTS = new Set(["localhost", "dev.pfeils-catering.de"]);

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
