import {
  mkdir,
  readdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

/**
 * Parses CLI flags into one options object.
 *
 * Keeping all defaults in one place makes the script easier to understand
 * and easier to extend later.
 */
function parseArgs(argv) {
  const options = {
    chromeFlags: "--headless=new",
    onlyCategories: "performance,accessibility,seo,best-practices",
    outputDir: ".lighthouse",
    preset: "desktop",
    sitemap: "https://www.pfeils-catering.de/sitemap-index.xml",
    skipAudits: "screenshot-thumbnails,final-screenshot,full-page-screenshot",
    targetOrigin: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = argv[index + 1];

    if (arg === "--sitemap" && nextValue) {
      options.sitemap = nextValue;
      index += 1;
      continue;
    }

    if (arg === "--target-origin" && nextValue) {
      options.targetOrigin = nextValue;
      index += 1;
      continue;
    }

    if (arg === "--preset" && nextValue) {
      options.preset = nextValue;
      index += 1;
      continue;
    }

    if (arg === "--only-categories" && nextValue) {
      options.onlyCategories = nextValue;
      index += 1;
      continue;
    }

    if (arg === "--output-dir" && nextValue) {
      options.outputDir = nextValue;
      index += 1;
      continue;
    }

    if (arg === "--chrome-flags" && nextValue) {
      options.chromeFlags = nextValue;
      index += 1;
      continue;
    }

    if (arg === "--skip-audits" && nextValue) {
      options.skipAudits = nextValue;
      index += 1;
      continue;
    }

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

/**
 * Prints the command help for local usage.
 */
function printHelp() {
  console.log(`Usage:
  node scripts/lighthouse-all.js [options]

Options:
  --sitemap <url>          Sitemap index URL to discover pages from
  --target-origin <url>    Rewrite all discovered URLs to this origin
  --preset <name>          Lighthouse preset, e.g. desktop
  --only-categories <csv>  Categories to audit
  --output-dir <dir>       Directory for JSON reports
  --chrome-flags <flags>   Chrome flags passed to Lighthouse
  --skip-audits <csv>      Audits to skip to keep reports smaller
  --help                   Show this help
`);
}

/**
 * Fetches a text resource such as a sitemap XML file.
 */
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}

/**
 * Extracts all <loc> values from a sitemap XML string.
 *
 * We only need the URLs, so a small regex is enough here.
 */
function extractLocs(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
}

/**
 * Collects every page URL from a sitemap or sitemap index.
 *
 * If the current file is a sitemap index, the function calls itself for every
 * nested sitemap. The "seen" Set prevents loops and duplicate work.
 */
async function collectUrlsFromSitemap(sitemapUrl, seen = new Set()) {
  if (seen.has(sitemapUrl)) {
    return [];
  }

  seen.add(sitemapUrl);
  const xml = await fetchText(sitemapUrl);
  const locs = extractLocs(xml);

  if (xml.includes("<sitemapindex")) {
    const nestedResults = await Promise.all(
      locs.map((loc) => collectUrlsFromSitemap(loc, seen)),
    );
    return nestedResults.flat();
  }

  // Ignore nested XML links if they somehow appear inside a normal sitemap.
  return locs.filter((loc) => !loc.endsWith(".xml"));
}

/**
 * Rewrites discovered URLs to another origin.
 *
 * This is useful for local testing when the sitemap contains production URLs
 * but Lighthouse should run against localhost.
 */
function rewriteOrigin(urls, targetOrigin) {
  if (!targetOrigin) {
    return urls;
  }

  return urls.map((url) => {
    const current = new URL(url);
    const target = new URL(targetOrigin);

    current.protocol = target.protocol;
    current.host = target.host;

    return current.toString();
  });
}

/**
 * Removes duplicate URLs while preserving the first occurrence order.
 */
function uniqueUrls(urls) {
  return [...new Set(urls)];
}

/**
 * Converts a URL into a filesystem-safe report name.
 */
function sanitizeFilename(url) {
  const parsed = new URL(url);
  const slug = `${parsed.hostname}${parsed.pathname === "/" ? "/home" : parsed.pathname}`
    .replace(/\/+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "report";
}

/**
 * Deletes old HTML reports from the output directory.
 *
 * The user only wants JSON artifacts in `.lighthouse`, so we clean up any old
 * HTML files from previous script versions before writing new results.
 */
async function removeHtmlReports(outputDir) {
  let entries = [];

  try {
    entries = await readdir(outputDir, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .map((entry) => unlink(path.join(outputDir, entry.name))),
  );
}

/**
 * Recursively removes embedded image data URLs from a Lighthouse JSON object.
 *
 * Those base64 strings make the reports much larger and are usually not useful
 * when the JSON is only read for scores and audit details.
 */
function stripEmbeddedImages(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripEmbeddedImages(item));
  }

  if (value && typeof value === "object") {
    const cleanedObject = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      const isEmbeddedImage =
        (key === "data" || key === "url") &&
        typeof nestedValue === "string" &&
        nestedValue.startsWith("data:image/");

      if (isEmbeddedImage) {
        continue;
      }

      cleanedObject[key] = stripEmbeddedImages(nestedValue);
    }

    return cleanedObject;
  }

  return value;
}

/**
 * Rewrites one JSON report after Lighthouse finishes.
 *
 * We keep the important audit data, but remove heavy image payloads so the
 * reports stay smaller and easier to diff.
 */
async function sanitizeJsonReport(reportPath) {
  const rawReport = await readFile(reportPath, "utf8");
  const parsedReport = JSON.parse(rawReport);
  const cleanedReport = stripEmbeddedImages(parsedReport);

  await writeFile(reportPath, `${JSON.stringify(cleanedReport, null, 2)}\n`);
}

/**
 * Sanitizes every existing JSON report in the output directory.
 *
 * This keeps the folder clean even when a new Lighthouse run stops early,
 * for example because one page returns 404.
 */
async function sanitizeExistingJsonReports(outputDir) {
  let entries = [];

  try {
    entries = await readdir(outputDir, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  const jsonFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".json"),
  );

  for (const entry of jsonFiles) {
    await sanitizeJsonReport(path.join(outputDir, entry.name));
  }
}

/**
 * Runs one shell command and resolves when it exits successfully.
 */
async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} failed with exit code ${code}`));
    });
  });
}

/**
 * Runs Lighthouse for one URL and stores a JSON report on disk.
 */
async function runLighthouse(url, options) {
  const fileBase = path.join(options.outputDir, sanitizeFilename(url));
  const reportPath = `${fileBase}.report.json`;
  const args = [
    "lighthouse",
    url,
    "--preset",
    options.preset,
    "--only-categories",
    options.onlyCategories,
    "--output",
    "json",
    "--output-path",
    fileBase,
    "--chrome-flags",
    options.chromeFlags,
    "--quiet",
  ];

  // Skip screenshot-heavy audits so the generated JSON stays focused.
  if (options.skipAudits) {
    args.push(`--skip-audits=${options.skipAudits}`);
  }

  await runCommand("npx", args);
  await sanitizeJsonReport(reportPath);
}

/**
 * Main program flow:
 * 1. Read options
 * 2. Discover URLs from the sitemap
 * 3. Optionally rewrite them to another origin
 * 4. Audit each page one by one
 */
async function main() {
  const options = parseArgs(process.argv.slice(2));

  await mkdir(options.outputDir, { recursive: true });
  await removeHtmlReports(options.outputDir);
  await sanitizeExistingJsonReports(options.outputDir);

  console.log(`Discovering URLs from ${options.sitemap} ...`);

  const sitemapUrls = await collectUrlsFromSitemap(options.sitemap);
  const auditUrls = uniqueUrls(rewriteOrigin(sitemapUrls, options.targetOrigin));

  if (auditUrls.length === 0) {
    throw new Error("No URLs discovered from sitemap.");
  }

  console.log(`Found ${auditUrls.length} URLs.`);

  for (const [index, url] of auditUrls.entries()) {
    console.log(`\n[${index + 1}/${auditUrls.length}] Auditing ${url}`);
    await runLighthouse(url, options);
  }

  console.log(`\nFinished. JSON reports written to ${options.outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
