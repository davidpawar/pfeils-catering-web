/**
 * Checks the built site, after `astro build`.
 *
 * `npm run check` runs this once `dist/client` exists. It does not start a
 * server. The sitemap and the HTML are files. `robots.txt` is not a file: the
 * route answers per host, so this script calls that function directly.
 *
 * What it checks:
 * - the sitemap lists exactly the pages the source describes, and nothing else
 * - every listed page rendered: title, canonical, hreflang, and a footer
 * - production robots allow crawling and point at the sitemap
 * - localhost and the dev host disallow crawling
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Absolute path of the repository root (the folder that contains package.json).
 */
const root = path.resolve(import.meta.dirname, "..");

/**
 * Built static files. The Cloudflare adapter writes HTML and the sitemap here.
 */
const clientDir = path.join(root, "dist/client");

/**
 * How many posts the blog archive shows on one page.
 *
 * Page one is `/blog/`. Page two and later are `/blog/page/2/` and only exist
 * once a language has more posts than this. The same number is hardcoded in
 * four blog page files; this script checks that they still agree.
 */
const POSTS_PER_PAGE = 6;

/**
 * Human-readable problems. We collect them all so one run shows every failure.
 */
const errors = [];

/**
 * Records one problem without stopping the script.
 *
 * Later checks still run, so a junior sees the full list instead of fixing
 * one error, re-running, and discovering the next one.
 *
 * @param {string} message - What is wrong, including the URL or file name.
 */
function addError(message) {
  errors.push(message);
}

/**
 * Reads a repository file as text.
 *
 * Paths are relative to the repo root, for example "astro.config.mjs".
 *
 * @param {string} relativePath
 * @returns {string}
 */
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

/**
 * Reads the public site origin from the Astro config.
 *
 * The sitemap and the canonical URLs are absolute, so the check needs the
 * same origin the build used. A missing value fails the later comparisons.
 *
 * @returns {string} Origin without a trailing slash, or "" when unreadable.
 */
function siteOrigin() {
  const site = read("astro.config.mjs").match(/site:\s*"([^"]+)"/)?.[1];
  if (!site) {
    addError("Could not read site from astro.config.mjs");
    return "";
  }
  return site.replace(/\/$/, "");
}

/**
 * Reads German path to English path pairs from src/routing/routes.ts.
 *
 * The shape matches `pagePaths`: the key is the German URL, the value is the
 * English path without `/en/`.
 *
 * @param {string} source - Full text of src/routing/routes.ts.
 * @returns {[string, string][]}
 */
function pagePathEntries(source) {
  const block = source.match(/export const pagePaths = \{([\s\S]*?)\n\} as const;/)?.[1] ?? "";
  if (!block) {
    addError("Could not read pagePaths from src/routing/routes.ts");
  }

  return [...block.matchAll(/(?:"([^"]+)"|([A-Za-z0-9-]+))\s*:\s*"([^"]+)"/g)].map(
    (match) => [match[1] ?? match[2], match[3]],
  );
}

/**
 * Lists blog slugs for one language.
 *
 * The filename without `.mdx` is the URL slug. German posts live under
 * `src/content/blog/de`, English posts under `en`.
 *
 * @param {"de" | "en"} lang
 * @returns {string[]}
 */
function blogSlugs(lang) {
  const directory = path.join(root, "src/content/blog", lang);
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.slice(0, -".mdx".length));
}

/**
 * Reads every posts-per-page number from the blog page files.
 *
 * The archive root and the `/page/` route each repeat the number, in both
 * languages. If one file drifts, the sitemap and this check would disagree
 * about whether `/blog/page/2/` exists.
 *
 * @returns {number[]}
 */
function postsPerPageValues() {
  const files = [
    "src/pages/blog/index.astro",
    "src/pages/blog/page/[page].astro",
    "src/pages/en/blog/index.astro",
    "src/pages/en/blog/page/[page].astro",
  ];
  const values = [];

  for (const file of files) {
    values.push(
      ...[...read(file).matchAll(/POSTS_PER_PAGE = (\d+)|postsPerPage = (\d+)/g)].map((match) =>
        Number(match[1] ?? match[2]),
      ),
    );
  }

  return values;
}

/**
 * Archive URLs for one language, including page 2 and later when needed.
 *
 * Page one stays at the archive root. Later pages use `/page/2/`, which is
 * what `src/pages/blog/page/[page].astro` builds.
 *
 * @param {string} archivePath - `/blog` or `/en/blog`, no trailing slash.
 * @param {number} postCount
 * @returns {string[]}
 */
function archivePaths(archivePath, postCount) {
  const totalPages = Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE));
  const paths = [`${archivePath}/`];

  for (let page = 2; page <= totalPages; page += 1) {
    paths.push(`${archivePath}/page/${page}/`);
  }

  return paths;
}

/**
 * Every HTML page the sitemap is expected to list.
 *
 * Built from the routing file and the blog folders, not from the sitemap
 * itself, so a missing or extra URL fails the check.
 *
 * @param {string} origin
 * @returns {Set<string>}
 */
function expectedPageUrls(origin) {
  const urls = new Set([`${origin}/`, `${origin}/en/`]);

  for (const [dePath, enPath] of pagePathEntries(read("src/routing/routes.ts"))) {
    urls.add(`${origin}/${dePath}/`);
    urls.add(`${origin}/en/${enPath}/`);
  }

  for (const archivePath of archivePaths("/blog", blogSlugs("de").length)) {
    urls.add(`${origin}${archivePath}`);
  }
  for (const archivePath of archivePaths("/en/blog", blogSlugs("en").length)) {
    urls.add(`${origin}${archivePath}`);
  }

  for (const slug of blogSlugs("de")) urls.add(`${origin}/blog/${slug}/`);
  for (const slug of blogSlugs("en")) urls.add(`${origin}/en/blog/${slug}/`);

  return urls;
}

/**
 * Pulls every `<loc>` text out of a sitemap XML string.
 *
 * @param {string} xml
 * @returns {string[]}
 */
function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

/**
 * Collects page URLs from the sitemap index and its child files.
 *
 * The index points at files such as `sitemap-0.xml`. Those files list the
 * pages. A loc that is itself a sitemap is not a page.
 *
 * @param {string} origin
 * @returns {string[]}
 */
function sitemapPageUrls(origin) {
  const indexPath = path.join(clientDir, "sitemap-index.xml");
  if (!fs.existsSync(indexPath)) {
    addError("dist/client/sitemap-index.xml is missing. Run the build first.");
    return [];
  }

  const indexLocs = sitemapLocs(fs.readFileSync(indexPath, "utf8"));
  if (indexLocs.length === 0) {
    addError("sitemap-index.xml has no <loc> entries");
    return [];
  }

  const pageUrls = [];

  for (const loc of indexLocs) {
    let childUrl;
    try {
      childUrl = new URL(loc);
    } catch {
      addError(`Sitemap index loc is not a URL: ${loc}`);
      continue;
    }

    if (childUrl.origin !== origin) {
      addError(`Sitemap index loc is outside the site origin: ${loc}`);
      continue;
    }

    const childPath = path.join(clientDir, childUrl.pathname.replace(/^\//, ""));
    if (!fs.existsSync(childPath)) {
      addError(`Sitemap index points at a missing file: ${loc}`);
      continue;
    }

    const childXml = fs.readFileSync(childPath, "utf8");
    if (childXml.includes("<sitemapindex")) {
      addError(`Nested sitemap indexes are not used here: ${loc}`);
      continue;
    }

    pageUrls.push(...sitemapLocs(childXml));
  }

  return pageUrls;
}

/**
 * Compares the built sitemap with the pages the source should publish.
 *
 * @param {string} origin
 * @returns {string[]} The page URLs to render-check. Empty when the sitemap is missing.
 */
function checkSitemap(origin) {
  const found = sitemapPageUrls(origin);
  const foundSet = new Set(found);
  if (foundSet.size !== found.length) {
    addError("Sitemap lists the same page more than once");
  }

  const expected = expectedPageUrls(origin);

  for (const url of expected) {
    if (!foundSet.has(url)) addError(`Sitemap is missing ${url}`);
  }
  for (const url of foundSet) {
    if (!expected.has(url)) addError(`Sitemap has an unexpected URL: ${url}`);
  }

  return [...foundSet];
}

/**
 * Where a page URL was written in the build.
 *
 * `/` is `dist/client/index.html`. Every other path is a folder with its
 * own `index.html`, which is how Astro emits trailing-slash URLs.
 *
 * @param {string} pageUrl
 * @returns {string}
 */
function htmlFileFor(pageUrl) {
  const { pathname } = new URL(pageUrl);
  if (pathname === "/") return path.join(clientDir, "index.html");
  return path.join(clientDir, pathname.replace(/^\//, ""), "index.html");
}

/**
 * Language the page URL should declare on `<html>`.
 *
 * German has no prefix. Anything under `/en/` is English, including `/en/`
 * itself.
 *
 * @param {string} pageUrl
 * @returns {"de" | "en"}
 */
function langFor(pageUrl) {
  const { pathname } = new URL(pageUrl);
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "de";
}

/**
 * Checks that one built page is real HTML for that URL.
 *
 * A file that exists but is the wrong page fails the canonical comparison.
 * A shell without a title, language links, or footer fails too.
 *
 * @param {string} pageUrl
 */
function checkRenderedPage(pageUrl) {
  const file = htmlFileFor(pageUrl);
  if (!fs.existsSync(file)) {
    addError(`Rendered page is missing: ${path.relative(root, file)}`);
    return;
  }

  const html = fs.readFileSync(file, "utf8");
  const lang = html.match(/<html lang="([^"]+)"/)?.[1];
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const hreflang = new Set(
    [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((match) => match[1]),
  );

  if (lang !== langFor(pageUrl)) {
    addError(`${pageUrl} declares lang="${lang ?? ""}", expected ${langFor(pageUrl)}`);
  }
  if (!title) addError(`${pageUrl} has no <title>`);
  if (canonical !== pageUrl) {
    addError(`${pageUrl} canonical is ${canonical ?? "missing"}`);
  }
  for (const code of ["de", "en", "x-default"]) {
    if (!hreflang.has(code)) addError(`${pageUrl} is missing hreflang="${code}"`);
  }
  if (!html.includes("<footer")) addError(`${pageUrl} has no footer`);
}

/**
 * Calls the robots route the way Astro would for one host.
 *
 * `site` stays the production origin from the config. Only the request host
 * changes, because that is what the route uses to allow or block indexing.
 *
 * @param {string} requestUrl
 * @param {string} origin
 * @returns {Promise<string>}
 */
async function robotsBody(requestUrl, origin) {
  const routeUrl = pathToFileURL(path.join(root, "src/pages/robots.txt.ts")).href;
  const { GET } = await import(routeUrl);
  const response = GET({
    request: new Request(requestUrl),
    site: new URL(origin),
  });
  return response.text();
}

/**
 * Checks the three hosts the robots route treats differently.
 *
 * Production may be crawled and publishes the sitemap URL. Localhost and the
 * dev host must disallow everything, so staging does not compete in search.
 *
 * @param {string} origin
 */
async function checkRobots(origin) {
  const production = await robotsBody(`${origin}/robots.txt`, origin);
  const localhost = await robotsBody("http://localhost:4321/robots.txt", origin);
  const devHost = await robotsBody("https://dev.pfeils-catering.de/robots.txt", origin);
  const blocked = "User-agent: *\nDisallow: /\n";

  if (production !== `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap-index.xml\n`) {
    addError(`Production robots.txt is wrong:\n${production}`);
  }
  if (localhost !== blocked) addError(`localhost robots.txt is wrong:\n${localhost}`);
  if (devHost !== blocked) addError(`dev host robots.txt is wrong:\n${devHost}`);
}

/**
 * Confirms the blog page size did not drift, then runs the site checks.
 *
 * The size check comes first because the expected sitemap depends on it.
 */
async function main() {
  if (!fs.existsSync(clientDir)) {
    addError("dist/client is missing. Run the build first.");
  }

  const pageSizes = postsPerPageValues();
  if (pageSizes.length === 0 || pageSizes.some((value) => value !== POSTS_PER_PAGE)) {
    addError(
      `Blog page size must stay ${POSTS_PER_PAGE} in every blog page file, found ${pageSizes.join(", ") || "nothing"}`,
    );
  }

  const origin = siteOrigin();
  const pageUrls = origin && fs.existsSync(clientDir) ? checkSitemap(origin) : [];
  for (const pageUrl of pageUrls) checkRenderedPage(pageUrl);
  if (origin) await checkRobots(origin);

  if (errors.length > 0) {
    console.error(`Site check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Site check passed (${pageUrls.length} pages).`);
}

await main();
