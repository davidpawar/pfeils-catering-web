/**
 * Checks the content an agent is expected to keep in sync.
 *
 * Run this before the production build (`npm run check` does that).
 * It does not render pages. It only reads source files and prints every
 * problem it finds, then exits with an error if any check failed.
 *
 * What it checks:
 * - every German translation key exists in English, and the other way around
 * - meta titles and descriptions stay inside the SEO length rules
 * - every marketing route has a view file, and every view file is used
 * - blog posts exist in both languages with the same filename
 * - every image in imageProvider has German and English alt text
 * - widget backgrounds alternate, and the section before the footer is not dark
 */
import fs from "node:fs";
import path from "node:path";

/**
 * Absolute path of the repository root (the folder that contains package.json).
 */
const root = path.resolve(import.meta.dirname, "..");

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
 * @param {string} message - What is wrong, including the file or key name.
 */
function addError(message) {
  errors.push(message);
}

/**
 * Reads a repository file as text.
 *
 * Paths are relative to the repo root, for example "src/i18n/translations/de.ts".
 *
 * @param {string} relativePath
 * @returns {string}
 */
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

/**
 * Lists every .astro file under a folder, including subfolders.
 *
 * The returned paths keep the folder, so "einsatzgebiete/koeln.astro" stays
 * distinct from a top-level file. Paths use forward slashes on every OS.
 *
 * @param {string} relativeDirectory - Folder inside the repo, for example "src/views".
 * @returns {string[]}
 */
function listAstroFiles(relativeDirectory) {
  const directory = path.join(root, relativeDirectory);
  const files = [];

  /**
   * Collects .astro files from one folder and descends into subfolders.
   */
  function walk(currentDirectory) {
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      const fullPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.name.endsWith(".astro")) {
        files.push(path.relative(directory, fullPath).split(path.sep).join("/"));
      }
    }
  }

  walk(directory);
  return files;
}

/**
 * Reads the quoted keys from a translation file.
 *
 * de.ts and en.ts are flat objects: each line looks like `"home.meta.title": "..."`.
 * We only need the key names here, not the translated sentences.
 *
 * @param {string} source - Full text of de.ts or en.ts.
 * @returns {string[]}
 */
function translationKeys(source) {
  return [...source.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1]);
}

/**
 * Reads meta titles and descriptions from a translation file.
 *
 * A value can sit on the same line as the key, or on the next line when the
 * sentence is long. Both forms appear in de.ts and en.ts.
 *
 * @param {string} source
 * @returns {{ key: string, kind: "title" | "description", value: string }[]}
 */
function metaEntries(source) {
  const entries = [];
  const pattern =
    /"([^"]+\.meta\.(title|description))":\s*(?:"((?:\\.|[^"\\])*)"|(?:\s*\n\s*"((?:\\.|[^"\\])*)"))/g;

  for (const match of source.matchAll(pattern)) {
    entries.push({
      key: match[1],
      kind: match[2],
      value: match[3] ?? match[4] ?? "",
    });
  }

  return entries;
}

/**
 * Reads the German paths from src/routing/routes.ts.
 *
 * Keys are German paths, slashes kept (`einsatzgebiete/koeln`).
 *
 * @param {string} source - Full text of src/routing/routes.ts.
 * @returns {string[]}
 */
function germanPaths(source) {
  const block = source.match(/export const pagePaths = \{([\s\S]*?)\n\} as const;/)?.[1] ?? "";

  return [...block.matchAll(/(?:"([^"]+)"|([A-Za-z0-9-]+))\s*:\s*"[^"]+"/g)].map(
    (match) => match[1] ?? match[2],
  );
}

/**
 * Reads which view each German path renders, from src/routing/views.ts.
 *
 * Resolves the component name to its file: the entry
 * `"einsatzgebiete/koeln": Koeln` plus the import of
 * `../views/einsatzgebiete/koeln.astro` becomes
 * `einsatzgebiete/koeln` → `einsatzgebiete/koeln`.
 *
 * @param {string} source - Full text of src/routing/views.ts.
 * @returns {Map<string, string | undefined>}
 */
function viewFileByPath(source) {
  const fileByComponent = new Map();
  for (const match of source.matchAll(
    /import\s+([A-Za-z0-9]+)\s+from\s+"\.\.\/views\/([^"]+)\.astro"/g,
  )) {
    fileByComponent.set(match[1], match[2]);
  }

  const block = source.match(/export const views = \{([\s\S]*?)\n\} satisfies/)?.[1] ?? "";
  const byPath = new Map();
  for (const match of block.matchAll(
    /(?:"([^"]+)"|([A-Za-z0-9-]+))\s*:\s*([A-Za-z0-9]+)/g,
  )) {
    byPath.set(match[1] ?? match[2], fileByComponent.get(match[3]));
  }

  const homeComponent = source.match(/export const homeView = ([A-Za-z0-9]+);/)?.[1];
  if (homeComponent) byPath.set("home", fileByComponent.get(homeComponent));

  return byPath;
}

/**
 * Checks that de.ts and en.ts contain the same keys.
 *
 * A missing English key would show German text on the English site, because
 * useTranslations falls back to German. TypeScript catches this too; this
 * check says which key is missing.
 */
function checkTranslationKeys() {
  const germanKeys = new Set(translationKeys(read("src/i18n/translations/de.ts")));
  const englishKeys = new Set(translationKeys(read("src/i18n/translations/en.ts")));

  for (const key of germanKeys) {
    if (!englishKeys.has(key)) addError(`Missing English translation key: ${key}`);
  }

  for (const key of englishKeys) {
    if (!germanKeys.has(key)) addError(`Missing German translation key: ${key}`);
  }
}

/**
 * Checks SEO length rules from AGENTS.md.
 *
 * Titles must end with "| Pfeil's Catering" and be 50–60 characters.
 * Descriptions must be 120–158 characters. Both languages are checked.
 */
function checkMetaLengths() {
  const brandSuffix = "| Pfeil's Catering";

  for (const [lang, relativePath] of [
    ["de", "src/i18n/translations/de.ts"],
    ["en", "src/i18n/translations/en.ts"],
  ]) {
    for (const entry of metaEntries(read(relativePath))) {
      if (entry.kind === "title") {
        if (!entry.value.endsWith(brandSuffix)) {
          addError(`${lang} ${entry.key} must end with ${brandSuffix}`);
        }
        if (entry.value.length < 50 || entry.value.length > 60) {
          addError(`${lang} ${entry.key} is ${entry.value.length} characters (need 50–60)`);
        }
      }

      if (
        entry.kind === "description" &&
        (entry.value.length < 120 || entry.value.length > 158)
      ) {
        addError(`${lang} ${entry.key} is ${entry.value.length} characters (need 120–158)`);
      }
    }
  }
}

/**
 * Checks the two routing files against the view files on disk.
 *
 * `satisfies` in views.ts already makes TypeScript demand a view for every
 * path, so the remaining risks are a path pointing at the wrong view file and
 * a view nobody renders.
 *
 * The German path is also the file path: "einsatzgebiete/koeln" must render
 * src/views/einsatzgebiete/koeln.astro. The homepage is the exception, it has
 * no slug and is mounted by src/pages/index.astro.
 */
function checkViewsMatchRoutes() {
  const paths = germanPaths(read("src/routing/routes.ts"));
  const viewFiles = viewFileByPath(read("src/routing/views.ts"));

  if (paths.length === 0) {
    addError("Could not read pagePaths from src/routing/routes.ts");
  }

  /**
   * View files that some route renders, as paths under src/views.
   */
  const usedViews = new Set();
  const homeFile = viewFiles.get("home");
  if (homeFile) usedViews.add(homeFile);

  for (const dePath of paths) {
    const viewFile = viewFiles.get(dePath);

    if (!viewFile) {
      addError(`Path "${dePath}" from routes.ts has no view in src/routing/views.ts`);
      continue;
    }

    usedViews.add(viewFile);

    if (viewFile !== dePath) {
      addError(
        `Path "${dePath}" renders src/views/${viewFile}.astro. The view path must match the German path`,
      );
    }

    if (!fs.existsSync(path.join(root, "src/views", `${viewFile}.astro`))) {
      addError(`Missing view file: src/views/${viewFile}.astro`);
    }
  }

  for (const relativeFile of listAstroFiles("src/views")) {
    const viewPath = relativeFile.replace(/\.astro$/, "");
    if (!usedViews.has(viewPath)) {
      addError(`src/views/${relativeFile} is not listed in src/routing/views.ts`);
    }
  }
}

/**
 * Checks that marketing pages are not copied into src/pages.
 *
 * Page composition belongs in src/views. src/pages may only contain the
 * router, the German homepage shell, the blog, and API routes.
 */
function checkNoDuplicateMarketingPages() {
  for (const relativeFile of listAstroFiles("src/pages")) {
    if (relativeFile === "[...slug].astro" || relativeFile === "index.astro") continue;
    if (
      relativeFile.startsWith("blog/") ||
      relativeFile.startsWith("en/blog/") ||
      relativeFile.startsWith("api/")
    ) {
      continue;
    }

    addError(`Marketing route file should live in src/views, not src/pages/${relativeFile}`);
  }
}

/**
 * Checks that every blog post exists in German and English.
 *
 * Both files must use the same name, for example
 * src/content/blog/de/foo.mdx and src/content/blog/en/foo.mdx.
 * The English URL then only adds the /en/ prefix.
 */
function checkBlogSlugPairs() {
  const germanPosts = fs
    .readdirSync(path.join(root, "src/content/blog/de"))
    .filter((name) => name.endsWith(".mdx"))
    .sort();
  const englishPosts = fs
    .readdirSync(path.join(root, "src/content/blog/en"))
    .filter((name) => name.endsWith(".mdx"))
    .sort();

  for (const name of germanPosts) {
    if (!englishPosts.includes(name)) addError(`English blog post missing for ${name}`);
  }

  for (const name of englishPosts) {
    if (!germanPosts.includes(name)) addError(`German blog post missing for ${name}`);
  }
}

/**
 * Checks that every registered image has alt text in both languages.
 *
 * imageProvider stores one object per image. `alt` is German. `altEn` is
 * English. A missing altEn would show the German description on /en/ pages.
 */
function checkImageAltText() {
  const source = read("src/provider/imageProvider.ts");
  // each image entry starts at a four-space indent, as in `    bambusbar: {`.
  const imageBlocks = source.split(/\n    [A-Za-z0-9]+: \{/).slice(1);

  for (const block of imageBlocks) {
    const name = source.slice(0, source.indexOf(block)).match(/([A-Za-z0-9]+): \{$/)?.[1];
    if (!block.includes("alt:")) addError(`Image is missing alt: ${name ?? "unknown"}`);
    if (!block.includes("altEn:")) {
      addError(`Image is missing altEn: ${name ?? block.slice(0, 40)}`);
    }
  }
}

/**
 * Background of a widget when the page does not pass a theme prop.
 *
 * Hero and the gallery/navigation blocks have a fixed background in the
 * component itself. The other widgets default to light (white).
 */
const fixedTheme = {
  HeroMain: "dark",
  HeroSubpage: "dark",
  ImageNavigation: "grey",
  ImageGalleryMasonry: "grey",
  Imprint: "light",
  PrivacyPolicy: "light",
};

/**
 * Widget tags whose background we compare. Navigation and Footer are not sections.
 */
const themedWidgets = new Set([
  "ImageText",
  "ItemList",
  "Testimonials",
  "FAQ",
  "CallToAction",
  "TextBlock",
  "ContactForm",
  ...Object.keys(fixedTheme),
]);

/**
 * Reads the background of each section in one view, from top to bottom.
 *
 * A widget can set theme="light" | "grey" | "dark". When it does not, we use
 * fixedTheme, or "light" for the widgets that default to white.
 *
 * @param {string} source - Full text of one view file.
 * @returns {{ name: string, theme: string }[]}
 */
function sectionThemes(source) {
  const sections = [];
  const componentPattern = /<([A-Z][A-Za-z]+)(\s[^]*?)?\/>/g;

  for (const match of source.matchAll(componentPattern)) {
    const name = match[1];
    if (!themedWidgets.has(name)) continue;

    const attributes = match[2] ?? "";
    const theme =
      attributes.match(/theme="(light|grey|dark)"/)?.[1] ?? fixedTheme[name] ?? "light";
    sections.push({ name, theme });
  }

  return sections;
}

/**
 * Checks the background rule from AGENTS.md.
 *
 * Two sections in a row must not share a background. The footer is dark, so
 * the last section on the page must be light or grey.
 */
function checkWidgetThemes() {
  for (const relativeFile of listAstroFiles("src/views")) {
    const sections = sectionThemes(read(`src/views/${relativeFile}`));

    for (let index = 1; index < sections.length; index += 1) {
      const previous = sections[index - 1];
      const current = sections[index];
      if (current.theme === previous.theme) {
        addError(
          `${relativeFile}: ${previous.name} and ${current.name} are both ${current.theme}`,
        );
      }
    }

    const last = sections.at(-1);
    if (last?.theme === "dark") {
      addError(`${relativeFile}: last section ${last.name} is dark, same as the footer`);
    }
  }
}

checkTranslationKeys();
checkMetaLengths();
checkViewsMatchRoutes();
checkNoDuplicateMarketingPages();
checkBlogSlugPairs();
checkImageAltText();
checkWidgetThemes();

if (errors.length > 0) {
  console.error(`Content check failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Content check passed.");
