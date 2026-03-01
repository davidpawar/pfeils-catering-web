# Pfeil's Cocktail Catering – Website

Website für Pfeil's Cocktail Catering, gebaut mit [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com) und dem [Cloudflare Adapter](https://docs.astro.build/en/guides/deploy/cloudflare/).

## Schnellstart

```bash
npm install
npm run dev      # Entwicklungsserver (http://localhost:4321)
npm run build    # Produktions-Build
npm run preview  # Vorschau mit Wrangler (Cloudflare)
npm run deploy   # Deploy zu Cloudflare Workers
```

---

## Architektur-Überblick

### Mehrsprachigkeit (i18n)

Die Website unterstützt **Deutsch** und **Englisch**. Die Standardsprache (DE) erscheint ohne Präfix in der URL; Englisch nutzt den Präfix `/en/`. Seiten haben je nach Sprache unterschiedliche URL-Slugs – die Zuordnung liegt in `translations.ts` unter `routes`.

**Utilities** (`src/i18n/utils.ts`): `getLangFromUrl`, `useTranslations`, `useTranslatedPath` und `getRouteFromUrl` steuern Spracherkennung, Übersetzungen und den Language Picker.

### Übersetzungen

UI-Texte sind in **getrennten Dateien** pro Sprache (`translations/de.ts`, `translations/en.ts`). `translations.ts` bündelt sie und exportiert `ui`. Fehlende Keys fallen auf die Standardsprache zurück.

### Image Provider

Bilder werden zentral über den **Image Provider** (`src/provider/imageProvider.ts`) verwaltet. Er bietet:

- **Astro-Optimierung** (WebP, responsive Größen)
- **Sprachabhängige Alt-Texte** (`alt` / `altEn`) über `getImageAlt(image, lang)`
- **Typsichere Referenzen** in Komponenten

Bilder liegen in `src/assets/images/` nach Kategorien (catering, cocktails, events, hero, logos, …). Statische Assets (z. B. für Blog) liegen in `public/`.

### Projektstruktur

| Bereich | Beschreibung |
|---------|--------------|
| `src/i18n/` | Mehrsprachigkeit, Übersetzungen, Routen-Mapping |
| `src/provider/` | Image Provider mit Alt-Texten pro Sprache |
| `src/components/` | Base (Nav, Footer), UI, Widgets |
| `src/pages/` | Deutsche Seiten im Root, englische unter `/en/` |
