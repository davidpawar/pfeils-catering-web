import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import net from "node:net";
import os from "node:os";
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
  node test/lighthouse-all.js [options]

Options:
  --sitemap <url>          Sitemap index URL to discover pages from
  --target-origin <url>    Rewrite all discovered URLs to this origin
  --preset <name>          Lighthouse preset, e.g. desktop
  --only-categories <csv>  Categories to audit
  --output-dir <dir>       Directory for JSON reports
  --chrome-flags <flags>   Extra flags for the one background Chrome
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

  // drop nested XML links that slipped into a normal sitemap.
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
 * Picks a free localhost port for Chrome's debugging protocol.
 *
 * Chrome has to be told the port before it starts. Binding to port 0 lets
 * the OS choose one, then we release it so Chrome can take it.
 *
 * @returns {Promise<number>}
 */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

/**
 * Waits until Chrome answers on its debugging port.
 *
 * `open` returns before Chrome is ready. Polling the version endpoint is
 * how we know the shared browser can take audits.
 *
 * @param {number} port
 */
async function waitForDebugger(port) {
  const deadline = Date.now() + 20000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {
      // chrome is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error("Headless Chrome did not open a debugging port.");
}

/**
 * Starts one headless Chrome and keeps it for the whole run.
 *
 * The Lighthouse CLI otherwise starts and quits Chrome for every URL. On
 * macOS that brings a new window to the front each time. One process,
 * launched hidden, stays in the background and every audit reuses it.
 *
 * @param {string} extraFlags - Space-separated flags from `--chrome-flags`.
 * @returns {Promise<{ port: number, stopped: boolean, userDataDir: string }>}
 */
async function startBackgroundChrome(extraFlags) {
  const port = await freePort();
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), "pfeils-lighthouse-"));
  const flags = [
    ...new Set([
      "--disable-gpu",
      "--headless=new",
      "--hide-scrollbars",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      "--window-position=-2400,-2400",
      ...extraFlags.split(/\s+/).filter((flag) => flag.startsWith("--")),
    ]),
  ];

  if (process.platform === "darwin") {
    const opened = spawn(
      "open",
      ["-n", "-g", "-j", "-a", "Google Chrome", "--args", ...flags],
      { stdio: "ignore" },
    );
    const code = await new Promise((resolve) => opened.on("close", resolve));
    if (code !== 0) {
      stopBackgroundChrome({ port, stopped: false, userDataDir });
      throw new Error("Could not start Google Chrome in the background.");
    }
  } else {
    spawn(process.env.CHROME_PATH || "google-chrome", flags, { stdio: "ignore" });
  }

  try {
    await waitForDebugger(port);
  } catch (error) {
    stopBackgroundChrome({ port, stopped: false, userDataDir });
    throw error;
  }

  return { port, stopped: false, userDataDir };
}

/**
 * Stops the shared Chrome and deletes its temporary profile.
 *
 * Safe to call twice. A signal handler and the normal finish path both use
 * it, and the second call must not kill an unrelated process.
 *
 * @param {{ port: number, stopped: boolean, userDataDir: string } | undefined} chrome
 */
function stopBackgroundChrome(chrome) {
  if (!chrome || chrome.stopped) return;

  chrome.stopped = true;
  const processes = spawnSync("ps", ["-axww", "-o", "pid=,command="], { encoding: "utf8" });

  for (const line of String(processes.stdout ?? "").split("\n")) {
    if (!line.includes(chrome.userDataDir)) continue;

    const pid = Number(line.trim().split(/\s+/)[0]);
    if (!pid) continue;

    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // already gone.
    }
  }

  rmSync(chrome.userDataDir, { force: true, recursive: true });
}

/**
 * Runs Lighthouse for one URL and stores a JSON report on disk.
 *
 * `--port` attaches to the shared background Chrome. Without it, Lighthouse
 * would start its own Chrome for this URL and bring that window forward.
 *
 * @param {string} url
 * @param {ReturnType<typeof parseArgs>} options
 * @param {number} port - Debugging port of the shared Chrome.
 */
async function runLighthouse(url, options, port) {
  const reportPath = path.join(
    options.outputDir,
    `${sanitizeFilename(url)}.report.json`,
  );
  const args = [
    "lighthouse",
    url,
    "--preset",
    options.preset,
    "--only-categories",
    options.onlyCategories,
    "--output",
    "json",
    // since Lighthouse 13.4 the path is used verbatim, so pass the full
    // report path; the tool no longer appends ".report.json".
    "--output-path",
    reportPath,
    "--port",
    String(port),
    "--chrome-flags",
    options.chromeFlags,
    "--quiet",
  ];

  // skip screenshot-heavy audits, so the JSON stays small.
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
 * 4. Start one background Chrome and audit every page with it
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

  const chrome = await startBackgroundChrome(options.chromeFlags);
  const stop = () => stopBackgroundChrome(chrome);
  process.on("SIGINT", () => {
    stop();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    stop();
    process.exit(143);
  });

  try {
    for (const [index, url] of auditUrls.entries()) {
      console.log(`\n[${index + 1}/${auditUrls.length}] Auditing ${url}`);
      await runLighthouse(url, options, chrome.port);
    }
  } finally {
    stop();
  }

  console.log(`\nFinished. JSON reports written to ${options.outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
