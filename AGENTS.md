# [AGENTS.md](http://AGENTS.md)

## Purpose

This project is an Astro marketing site for `Pfeil's Catering` with German as the canonical language and English as the translated secondary language.

This file is the working guide for AI agents and content teams. Its job is to help future AI:

- add or update page content in the right files
- use the existing components instead of inventing new structures
- register and reuse images correctly
- keep German and English content in sync
- ensure pages and components are responsive across devices

Use the existing patterns first. Prefer consistency over creativity.

## Project Mental Model

- Normal pages are assembled from:
`BaseHead` + `Navigation` + content widgets + `Footer`
- Blog pages use layouts instead of manual page assembly.
- German is the source of truth for copy, slugs, and structure.
- English mirrors the German content and route structure.

## Translation Workflow

### Where translations live

- UI and page copy lives in:
  - `src/i18n/translations/de.ts`
  - `src/i18n/translations/en.ts`
- Locale config and translated slugs live in:
  - `src/i18n/translations.ts`
- Runtime helpers for language detection and translated links live in:
  - `src/i18n/utils.ts`

### How translations work

- `de` is the default language.
- German URLs have no `/de/` prefix.
- English URLs use `/en/...`.
- Top-level translated slugs are defined in `src/i18n/translations.ts` under `routes.en`.
- A new localized page usually needs two actual page files:
  - German in `src/pages/...`
  - English in `src/pages/en/...`
- `routes.en` maps slugs, but it does not create page files for you.

Examples:

- `/firmenfeier/` -> `/en/corporate/`
- `/hochzeitsfeier/` -> `/en/wedding/`
- `/anfrage/` -> `/en/contact/`

### How to add or change text

When you update UI or page copy:

1. Add or update the German key in `src/i18n/translations/de.ts`.
2. Add or update the matching English key in `src/i18n/translations/en.ts`.
3. Reuse the same dotted key naming pattern already used in the project.

Good examples:

- `firmenfeier.textList.item1.title`
- `hochzeitsfeier.gallery.title`
- `hero.anfrage.title`
- `blog.meta.description`

### Important translation rules

- German content is canonical. Start there first.
- Always add keys to both locale files.
- Do not rely on fallback behavior as a workflow.
- `useTranslations()` falls back to German if an English key is missing. That is a safety net, not the desired final state.
- Only use HTML inside translation values when the receiving component explicitly expects HTML.

### Blog content is separate

Blog posts are not maintained in the translation dictionaries.

They live here:

- `src/content/blog/de/*.mdx`
- `src/content/blog/en/*.mdx`

Their schema is defined in:

- `src/content.config.ts`

Important notes:

- German and English blog posts are separate MDX files.
- German and English versions of the same blog post should use the same filename/slug in their respective folders.
- Blog frontmatter includes fields like `title`, `description`, `pubDate`, `heroImage`, and optional `lang`.
- Blog list and article pages are rendered through layouts, not hand-built widget pages.

## Image Workflow

### Where reusable images live

Most reusable site images live under:

- `src/assets/images/blog`
- `src/assets/images/catering`
- `src/assets/images/cocktails`
- `src/assets/images/events`
- `src/assets/images/hero`
- `src/assets/images/logo`
- `src/assets/images/logos`
- `src/assets/images/team`

### Where images are registered

Reusable images are centrally imported and registered in:

- `src/provider/imageProvider.ts`

Each image entry should have:

- `src`
- `alt` for German
- optional `altEn` for English

Use `getImageAlt()` from `src/provider/imageProvider.ts` to render localized alt text.

### How to add a new reusable image

1. Put the file into the correct folder in `src/assets/images/...`.
2. Import it in `src/provider/imageProvider.ts`.
3. Add an entry to the correct category in `imageProvider`.
4. Provide a good German `alt`.
5. Provide an English `altEn`.
6. Use the registered image via `imageProvider.<category>.<key>`.

Example:

- `imageProvider.events.firmenfeier`
- `imageProvider.catering.bambusbar`
- `imageProvider.hero.headerBackground`

### Important image rules

- Prefer `imageProvider` over raw ad hoc image paths.
- Do not scatter duplicate alt text across pages.
- If `altEn` is missing, English pages will show the German alt text.
- Most widgets expect an `ImageAsset` object from `imageProvider`, not a random string path.

### Blog image exception

Blog hero images are different.

- Blog frontmatter currently uses string paths like `/blog/...`
- These files come from `public/blog`
- They are validated through `src/content.config.ts`

So:

- use `imageProvider` for reusable site images
- use `public/blog/...` string paths for blog post hero images

### Hero image exception

Some subpage heroes use direct `imageUrl` strings instead of `imageProvider`.

Examples:

- `src/pages/en/corporate.astro`
- `src/components/widgets/HeroSubpage.astro`

Do not invent a third pattern. Follow the existing pattern of the page you are editing unless the team explicitly standardizes it later.

## Tracking Workflow

### Where tracking lives

- The global `window.trackEvent` helper is set up in `src/components/base/BaseHead.astro`.
- Events are sent to the server-side proxy at `/api/hello-pfeil`, which forwards them to Plausible.
- Shared types and the `Window` augmentation live in `src/types/tracking.ts` and `src/env.d.ts`.

### How to track events

Call `window.trackEvent` with an event object. Tracking only becomes active after the first human interaction (mousemove, touchmove, or keydown). Events fired before that are queued and sent once tracking is active.

```javascript
if (typeof window.trackEvent === "function") {
  window.trackEvent({
    eventAction: "CONTACT_FORM_STARTED",
    eventCategory: "CONTACT_FORM",
    eventName: "OPTIONAL_ELEMENT_ID",
    props: { form_id: "contact-form" },
  });
}
```

Always guard with `typeof window.trackEvent === "function"` so components work on blocked hosts (e.g. localhost) where tracking is disabled.

### The three-layer model

Use UPPERCASE_SNAKE_CASE for all event values.


| Layer             | Meaning                               | Example                                   |
| ----------------- | ------------------------------------- | ----------------------------------------- |
| **eventAction**   | What happened                         | `CONTACT_FORM_STARTED`, `FAQ_ITEM_OPENED` |
| **eventCategory** | Where it happened                     | `CONTACT_FORM`, `FAQ`, `PAGE`             |
| **eventName**     | Which element was affected (optional) | `PRICING_QUESTION`, `DELIVERY_AREA`       |


- `eventAction` and `eventCategory` are required.
- `eventName` is optional. Use it when a specific element is involved (e.g. which FAQ item was opened).
- `props` is optional. Use it for extra metadata like `form_id`, `lang`, or UTM data (UTM is added automatically from sessionStorage).

### Examples

**Contact form** (no `eventName`; the form itself is the context):

```javascript
window.trackEvent({
  eventAction: "CONTACT_FORM_STARTED",
  eventCategory: "CONTACT_FORM",
});

window.trackEvent({
  eventAction: "CONTACT_FORM_SUBMITTED",
  eventCategory: "CONTACT_FORM",
});
```

**FAQ accordion** (with `eventName` for the opened item):

```javascript
window.trackEvent({
  eventAction: "FAQ_ITEM_OPENED",
  eventCategory: "FAQ",
  eventName: "PRICING_QUESTION",
});
```

**Pageview** (handled automatically by BaseHead):

```javascript
// eventAction: "PAGEVIEW", eventCategory: "PAGE"
```

### Important tracking rules

- Use UPPERCASE_SNAKE_CASE for `eventAction`, `eventCategory`, and `eventName`.
- Do not invent new event names without checking existing ones in `ContactForm.astro` and `BaseHead.astro`.
- UTM parameters from the landing URL are captured and merged into every event automatically.
- The API endpoint is `/api/hello-pfeil` (not `/api/analytics` or similar).

## Component Catalog

Choose components by content goal, not by implementation details. The point of this section is fast matching:

- need the standard page shell and metadata: `BaseHead` + `Navigation` + `Footer`
- need a button-styled CTA link: `Button`
- need legal imprint content: `Imprint`
- need a hero for the homepage: `HeroMain`
- need a hero for a normal subpage: `HeroSubpage`
- need image + story + optional CTA: `ImageText`
- need cards or structured selling points: `ItemList`
- need visual links to key pages: `ImageNavigation`
- need longer editorial copy: `TextBlock`
- need a final conversion push: `CallToAction`
- need FAQs: `FAQ`
- need trust and proof: `Testimonials`
- need a contact page: `ContactForm`
- need a blog archive or article: use the blog layouts

### Base and UI components

#### `BaseHead`

File: `src/components/base/BaseHead.astro`

Use for:

- page metadata and SEO base setup

Use this when:

- creating any new normal page or layout

#### `Navigation`

File: `src/components/base/Navigation.astro`

Use for:

- the global page header and language switch entry point

Use this when:

- building any standard page

#### `Footer`

File: `src/components/base/Footer.astro`

Use for:

- the global page footer

Use this when:

- finishing any standard page

#### `Button`

File: `src/components/ui/Button.astro`

Use for:

- CTA links that should look like buttons

Use this when:

- you need a consistent CTA inside a section or layout

#### `Imprint`

File: `src/components/base/Imprint.astro`

Use for:

- legal imprint content

Use this when:

- working on the imprint/legal page only

### Widget components

#### `HeroMain`

File: `src/components/widgets/HeroMain.astro`

Use for:

- the homepage hero

Use this when:

- editing the landing page only

Do not:

- reuse it for service subpages

#### `HeroSubpage`

File: `src/components/widgets/HeroSubpage.astro`

Use for:

- compact subpage hero with title and optional background image

Use this when:

- creating a service page, contact page, or legal intro section

#### `ImageText`

File: `src/components/widgets/ImageText.astro`

Use for:

- image + copy storytelling blocks
- offer explanations
- benefit sections
- conversion sections with CTA

Use this when:

- you need the main marketing section type used across home and service pages
- you have one clear section with one image and one message
- you want to explain an offer, benefit, or booking reason

#### `ItemList`

File: `src/components/widgets/ItemList.astro`

Use for:

- structured card grids
- selling points
- reference lists
- service modules

Use this when:

- you have a list of benefits, references, or offerings
- you want repeated items with a consistent visual rhythm

#### `ImageNavigation`

File: `src/components/widgets/ImageNavigation.astro`

Use for:

- a 3-card visual navigation block

Use this when:

- the homepage should link users into 3 key service areas
- content should tease options rather than explain them in depth

#### `TextBlock`

File: `src/components/widgets/TextBlock.astro`

Use for:

- longer editorial text sections without an image

Use this when:

- you need 2-4 paragraphs of richer text and formatting
- a page needs more explanation without becoming another image section

#### `CallToAction`

File: `src/components/widgets/CallToAction.astro`

Use for:

- a focused end-of-page CTA block

Use this when:

- ending a service page with one clear action
- you want a simple booking/contact push without extra complexity

#### `FAQ`

File: `src/components/widgets/FAQ.astro`

Use for:

- question/answer sections
- objection handling
- SEO FAQ schema

Use this when:

- content can naturally be written as common questions and answers
- you want to reduce friction before inquiry

#### `Testimonials`

File: `src/components/widgets/Testimonials.astro`

Use for:

- social proof sections

Use this when:

- a page needs trust-building quotes after service details
- you have customer quotes, event feedback, or proof of quality

#### `ContactForm`

File: `src/components/widgets/ContactForm.astro`

Use for:

- inquiry/contact page body

Use this when:

- building the contact/request page

Important:

- this is a special-purpose widget, not a generic content block
- it posts to `/api/contact`

#### `BlogPostList`

File: `src/components/widgets/BlogPostList.astro`

Use for:

- blog overview pages
- paginated blog archives

Use this when:

- rendering blog index or paginated list pages
- you already have a list of blog entries and only need the archive UI

#### `ImageGalleryMasonry`

File: `src/components/widgets/ImageGalleryMasonry.astro`

Use for:

- gallery/proof sections with light supporting copy

Use this when:

- showcasing event or catering imagery with minimal text
- you want visual proof rather than long explanation

### Layouts

#### `BlogIndexLayout`

File: `src/layouts/BlogIndexLayout.astro`

Use for:

- blog list pages
- pagination pages

Use this when:

- building or changing blog archive pages
- an AI should create a blog overview, not a normal marketing page

#### `BlogPost`

File: `src/layouts/BlogPost.astro`

Use for:

- individual blog article pages

Use this when:

- rendering one blog article from MDX content
- an AI should turn article content into a proper blog detail page

## Widget Color Alternation

Widgets use three themes: `light` (white), `grey` (slate-100), and `dark` (dark-bg).

**Rule:** Never place two sections with the same background color back-to-back. Always alternate: light → grey or dark, grey → light or dark, dark → light or grey.

**Footer rule:** The last section before the footer must not use the same color as the footer. The footer is dark (`bg-dark-bg`), so the final widget on the page must be `light` or `grey`, never `dark`.

When assembling pages, check the sequence of `theme` props and ensure no two adjacent sections share the same theme.

## Responsive Design

**Rule:** All pages and components must be responsive. They must work correctly on mobile, tablet, and desktop viewports.

- Use fluid layouts, flexible images, and appropriate breakpoints.
- Test new or modified layouts at different screen widths.
- Do not introduce fixed widths that cause horizontal overflow on small screens.
- Existing widgets and layouts are built to be responsive; follow their patterns when adding content.

## Common Page Patterns

### Homepage pattern

Reference:

- `src/pages/index.astro`
- `src/pages/en/index.astro`

Typical structure:

1. `BaseHead`
2. `Navigation`
3. `HeroMain`
4. several `ImageText` sections
5. `ImageNavigation`
6. `ItemList`
7. `Testimonials`
8. `FAQ`
9. `Footer`

Use this when:

- creating or updating the main landing experience

### Service page pattern

Reference:

- `src/pages/hochzeitsfeier.astro`
- `src/pages/en/corporate.astro`
- `src/pages/mobile-cocktailbar.astro`

Typical structure:

1. `BaseHead`
2. `Navigation`
3. `HeroSubpage`
4. `ImageText`
5. `ItemList`
6. `ImageGalleryMasonry`
7. optional extra `ImageText` or `TextBlock`
8. `Testimonials`
9. `CallToAction`
10. `Footer`

Use this when:

- creating or extending a service/offer page

### Contact page pattern

Reference:

- `src/pages/anfrage.astro`
- `src/pages/en/contact.astro`

Typical structure:

1. `BaseHead`
2. `Navigation`
3. `HeroSubpage`
4. `ContactForm`
5. `Footer`

### Blog pattern

Reference:

- `src/pages/blog/[...slug].astro`
- `src/pages/en/blog/[...slug].astro`
- `src/layouts/BlogPost.astro`
- `src/layouts/BlogIndexLayout.astro`

Rules:

- blog articles come from MDX
- blog detail pages use `BlogPost`
- blog overview pages use `BlogIndexLayout`
- do not manually rebuild blog pages out of generic marketing widgets unless the site architecture is intentionally changed

## Rules For Future AI Content Work

### Do

- every German page must have an English variant – both page files and `routes.en` entry
- ensure all pages and components are responsive – work on mobile, tablet, and desktop
- ensure the LanguagePicker shows the correct link for every localized page – `getRouteFromUrl` must resolve nested paths (e.g. `einsatzgebiete/koeln`) and `routes.en` must contain the mapping
- alternate widget themes (light, grey, dark) – never two same-colored sections in a row; last section before footer must not be dark
- keep German and English in sync
- use UPPERCASE_SNAKE_CASE for tracking event values (`eventAction`, `eventCategory`, `eventName`)
- reuse existing component patterns
- use `imageProvider` for reusable site imagery
- write meaningful `alt` and `altEn` text
- keep new content structurally consistent with similar existing pages
- use translated links via `useTranslatedPath()`
- update `routes.en` in `src/i18n/translations.ts` when adding a new localized top-level page
- create both the German page file and the English page file when adding a new localized page

### Do not

- create layouts that break or overflow on small screens
- place two sections with the same theme (light, grey, dark) consecutively
- add new copy only in English
- hardcode visible text in pages when it belongs in translations
- use raw image paths when a provider image should exist
- put HTML into plain-text props
- invent a brand-new page structure without checking similar pages first
- bypass blog layouts for normal blog work

## Recommended AI Workflow

When adding a new service page:

1. Start from the most similar existing page.
2. Add German translation keys first.
3. Add matching English translation keys.
4. Register any reusable new images in `imageProvider`.
5. Assemble the page using the existing widget pattern.
6. Make sure all internal links use translated paths.
7. Verify that English alt text exists for every new reusable image.

When adding a new blog post:

1. Create the German MDX file in `src/content/blog/de/`.
2. Create the English MDX file in `src/content/blog/en/`.
3. Keep the same filename/slug in both folders for the same article.
4. Add the blog hero image in `public/blog/` if needed.
5. Fill frontmatter according to `src/content.config.ts`.
6. Let the existing blog layouts render the content.

