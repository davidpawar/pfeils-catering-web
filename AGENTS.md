# [AGENTS.md](http://AGENTS.md)

Astro marketing site for Pfeil's Catering. German is canonical; English mirrors it. Update this file when you change a reusable pattern.

Pages are `BaseHead` + `Navigation` + widgets + `Footer`. Blog uses the blog layouts. Copy lives in the translation files, not hardcoded in views. Run `npm run check` after content or route changes.

## Code style

Block comments on functions, methods, classes, and variable definitions. Say what it is for, mostly why, short enough for a junior.

A block comment is at least three lines. Never put it on one line. Leave a blank line before it, so it does not sit directly under the previous statement.

```ts
/**
 * What it is for.
 */
```

Inline comments start with a lowercase letter and end with a period.

Sort properties and class fields alphabetically by name. That covers interface and type fields, class fields, and keys in configuration objects such as `pagePaths`, `views`, and `imageProvider`. Leave arrays and translation files in their existing order: those follow the page, not the alphabet.

```ts
/**
 * German path to English path, slashes included.
 *
 * Nested routes stay readable because the key is the real path.
 */
const routes = { "einsatzgebiete/koeln": "service-areas/cologne" };

// keep inner slashes so nested keys match.
const pathName = path.replace(/^\/|\/$/g, "");
```

## How to add a content page

One composition per route, in `src/views/`. The file path is the German URL: `src/views/einsatzgebiete/koeln.astro` is `/einsatzgebiete/koeln/`. `src/pages/[...slug].astro` renders that file for both languages. Do not add `src/pages/en/...` for a marketing page.

Routing lives in `src/routing/`, in two files:

- `routes.ts`: `pagePaths` maps the German path to the English one (`"einsatzgebiete/koeln": "service-areas/cologne"`). This file imports nothing.
- `views.ts`: `views` maps the same German path to the view component. `satisfies Record<keyof typeof pagePaths, unknown>` makes TypeScript demand an entry for every path.

1. Copy the closest view. Keep the German path as the file path.
2. Add German keys in `src/i18n/translations/de.ts`, then the same keys in `en.ts`. Dotted names, as in `firmenfeier.textList.item1.title`.
3. Register new images in `imageProvider` (see "How to add an asset").
4. Add the path in `routes.ts` and the view in `views.ts`. Both keys are the German path. Forgetting the second one fails `tsc`.
5. Link with `useTranslatedPath()`, passing the German path (`translatePath("/anfrage/")`).
6. Run `npm run check`.

`src/pages/index.astro` mounts `homeView` for `/`, because a rest route cannot match it. English home is the same view at `/en/`, built by the router. `homeView` is separate from `views` because it has no slug to translate.

`blog` is not a view. It lives in `sharedPaths`: the path is identical in both languages and only gets the `/en/` prefix. Articles are MDX with their own page files.

Keep `routes.ts` free of imports. The views import the i18n helpers, and the helpers read `routes.ts`. Importing a view there would close that loop and break the build during prerendering.

Match an existing sequence. Do not invent a new page shape.

- Home (`src/views/home.astro`): `HeroMain`, `ImageText`, `ImageNavigation`, `ItemList`, `Testimonials`, `FAQ`. `HeroMain` is home only.
- Service (`src/views/hochzeitsfeier.astro`, `src/views/mobile-cocktailbar.astro`): `HeroSubpage`, `ImageText`, `ItemList`, `ImageGalleryMasonry`, optional `TextBlock`, `Testimonials`, `CallToAction`.
- City (`src/views/einsatzgebiete/koeln.astro`): same widgets as the other city views, with original copy. Do not swap only the place name. Vary landmarks, venues, FAQs, titles, and process wording.
- Contact (`src/views/anfrage.astro`): `HeroSubpage` + `ContactForm`.
- Legal (`src/views/impressum.astro`, `src/views/datenschutz.astro`): `HeroSubpage` (title only) + `Imprint` or `PrivacyPolicy`.

## Translations

- `src/i18n/translations/de.ts` and `en.ts`: UI and page copy. Every key in both files. Start with German.
- `src/i18n/translations.ts`: locales, and it re-exports `routes` from `src/routing/routes.ts`.
- `src/i18n/utils.ts`: `getLangFromUrl`, `useTranslations`, `useTranslatedPath`, `getRouteFromUrl`. `getRouteFromUrl` must resolve nested paths so the language switch and `hreflang` point at the same page.
- German URLs have no `/de/` prefix. English uses `/en/...`.
- `useTranslations()` falls back to German when an English key is missing. That is a safety net, not the workflow.
- HTML inside a translation value only when the component expects HTML (`descriptionHtml` and similar). No HTML in plain-text props.
- No hardcoded visible copy in views.

## How to add a blog post

Posts are MDX, not translation keys and not views. Same filename in both languages. Routes stay `src/pages/blog/` and `src/pages/en/blog/`. Layouts `BlogIndexLayout` and `BlogPost` render them. Do not build a blog page out of marketing widgets.

1. Create `src/content/blog/de/<slug>.mdx` and `src/content/blog/en/<slug>.mdx`.
2. Fill frontmatter per `src/content.config.ts`: `title`, `description`, `pubDate`, optional `lang`, optional `heroImageKey`, optional `faq`.
3. For a hero, register the image with `blogHero: true` (see "How to add an asset"), then set `heroImageKey` to that flat key (`firmenfeierFullSetup`). The content schema rejects unknown keys.
4. Inline images use `BlogImage` with `imageProvider` and `getImageAlt()`. Detail heroes are Astro `<Image>`, eager and high priority, not a CSS background.
5. If the post has an FAQ, follow the FAQ rules below.
6. Run `npm run check`.

## How to add an asset

If the user attaches an image in the chat, save that file into the matching folder below. They do not need to name a path. `alt` and `altEn` come from their own description of what is in the picture, not from guessing the photo. If they did not describe it, ask before registering the image.

1. Put the file in `src/assets/images/` by category: `blog`, `catering`, `cocktails`, `events/<type>`, `hero`, `logo`, `logos`, `service-areas`, `team`.
2. Import it in `src/provider/imageProvider.ts` and add it to the matching category with `src`, German `alt`, and English `altEn`.
3. Use it as `imageProvider.<category>.<key>`. Widgets take that `ImageAsset`, not a string path. Localized alt text goes through `getImageAlt()` in `src/utils/imageUtils.ts`.
4. A blog hero also needs `blogHero: true`. The flat key is what `heroImageKey` refers to. Lookup is `src/utils/blogImages.ts`.
5. Run `npm run check`.

A missing `altEn` shows the German alt on English pages. Use `<Image>` with `sizes` and `widths`. Do not over-compress sources. Do not use a CSS background for a content image. Subpage heroes use `HeroSubpage` with `image={imageProvider...}`.

## Blog rules

Do not put the `FAQ` widget in MDX. It is a full-width page section and breaks the article grid in `BlogPost.astro`.

Write a Markdown `## FAQ` with `### Question` and an answer paragraph. FAQs are informational, third person: no "wir"/"we", no "unser Team"/"our team", no product pitch. A light generic hint is fine ("a mobile catering service usually brings glassware, ice and tables"). Mention Pfeil's only in the conclusion, not in the FAQ.

For `FAQPage` JSON-LD, add a `faq` array to frontmatter. `BlogPost.astro` emits it. Plain text only (no `**bold**`). Keep it identical to the visible FAQ, in both languages.

```yaml
faq:
  - question: "How early should we start planning?"
    answer: "It depends on headcount: for up to ~100 guests, 8–12 weeks is usually enough."
```

## Widgets

Files are under `src/components/widgets/` unless noted. Pass `theme="light" | "grey" | "dark"` where the widget has a theme. `light` is white, `grey` is slate-100, `dark` is `bg-dark-bg`.

| Widget                  | File                                | Use                                                       |
| ----------------------- | ----------------------------------- | --------------------------------------------------------- |
| `HeroMain`              | `widgets/HeroMain.astro`            | Homepage hero only. Dark                                  |
| `HeroSubpage`           | `widgets/HeroSubpage.astro`         | Subpage hero, optional `image`. Dark                      |
| `ImageText`             | `widgets/ImageText.astro`           | One image, one message, optional CTA                      |
| `ItemList`              | `widgets/ItemList.astro`            | Cards: benefits, references, modules                      |
| `ImageNavigation`       | `widgets/ImageNavigation.astro`     | Three visual links. Grey                                  |
| `TextBlock`             | `widgets/TextBlock.astro`           | A few paragraphs, no image                                |
| `ImageGalleryMasonry`   | `widgets/ImageGalleryMasonry.astro` | Photo proof. Grey                                         |
| `Testimonials`          | `widgets/Testimonials.astro`        | Quotes                                                    |
| `FAQ`                   | `widgets/FAQ.astro`                 | Marketing-page questions and FAQ schema                   |
| `CallToAction`          | `widgets/CallToAction.astro`        | Closing booking push                                      |
| `ContactForm`           | `widgets/ContactForm.astro`         | Contact page only. Posts to `/api/contact`                |
| `Button`                | `ui/Button.astro`                   | CTA-styled link                                           |
| `Imprint`               | `base/Imprint.astro`                | Imprint page only                                         |
| `PrivacyPolicy`         | `base/PrivacyPolicy.astro`          | Privacy page only                                         |
| `BlogPostList`          | `widgets/BlogPostList.astro`        | Blog archive inside the blog layouts                      |
| `BaseHead`              | `base/BaseHead.astro`               | Metadata, canonical, `hreflang` (`de`, `en`, `x-default`) |
| `Navigation` / `Footer` | `base/`                             | Every standard page                                       |

Never place two sections with the same background in a row. The footer is dark, so the last widget is `light` or `grey`.

Layouts stay fluid on mobile, tablet, and desktop. No fixed widths that cause horizontal overflow.

## SEO

Titles (`*.meta.title`): 50–60 characters, ending with `| Pfeil's Catering`. Descriptions (`*.meta.description`): 120–158 characters. Both languages.

## Tracking

`window.trackEvent` is set up in `BaseHead`. Events go to `/api/hello-pfeil` (not `/api/analytics`), which forwards them to Plausible. Types live in `src/types/tracking.ts` and `src/env.d.ts`.

Tracking starts after the first mousemove, touchmove, or keydown. Earlier events are queued. Guard every call with `typeof window.trackEvent === "function"`.

`eventAction` and `eventCategory` are required. `eventName` is optional (which element). `props` is optional (`form_id`, `lang`). UTM from the landing URL is merged in automatically. Use `UPPERCASE_SNAKE_CASE`. The pageview event is the exception: `eventAction: "pageview"`, so Plausible can fill Entry/Exit pages. Reuse names from `ContactForm.astro` and `BaseHead.astro` before inventing new ones.

```javascript
window.trackEvent({
  eventAction: "FAQ_ITEM_OPENED",
  eventCategory: "FAQ",
  eventName: "PRICING_QUESTION",
});
```

## Checks

Scripts live in `test/`. `npm run check` runs `content-check.mjs`, the production build, `site-check.mjs`, `contact-check.mjs`, `tsc`, and a Wrangler dry-run.

`content-check.mjs` reads source: translation keys, meta length, routes against views, blog pairs, alt text, widget themes. `site-check.mjs` reads `dist/client`: sitemap, rendered pages, and `robots.txt` (production allows crawling, `localhost` and `dev.pfeils-catering.de` do not). `contact-check.mjs` starts `astro preview` and posts to `/api/contact`, including one complete form. Inquiry and confirmation both go to `CONTACT_TO_EMAIL`.

`npm run lighthouse:local` audits `localhost:4321`. `npm run lighthouse:prod` writes reports to `.lighthouse/`. Both run `test/lighthouse-all.js`, which keeps one headless Chrome in the background. Local SEO stays low because `robots.txt.ts` blocks `localhost`.
