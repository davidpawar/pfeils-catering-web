// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://www.pfeils-catering.de",
  // Astro 7 changed the default to 'jsx' (strips whitespace between inline
  // elements). Keep the previous HTML-aware behavior to avoid spacing regressions.
  compressHTML: true,
  integrations: [mdx(), sitemap()],

  adapter: cloudflare({
    imageService: "compile",
    prerenderEnvironment: "node",
  }),

  vite: {
    plugins: [tailwindcss()],
  },
});