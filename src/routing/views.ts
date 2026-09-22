import Anfrage from "../views/anfrage.astro";
import Datenschutz from "../views/datenschutz.astro";
import Firmenfeier from "../views/firmenfeier.astro";
import Gummersbach from "../views/einsatzgebiete/gummersbach.astro";
import Hochzeitsfeier from "../views/hochzeitsfeier.astro";
import Home from "../views/home.astro";
import Impressum from "../views/impressum.astro";
import IndividuellesCatering from "../views/individuelles-catering.astro";
import Koeln from "../views/einsatzgebiete/koeln.astro";
import MesseCatering from "../views/messe-catering.astro";
import MobileCocktailbar from "../views/mobile-cocktailbar.astro";
import Nuembrecht from "../views/einsatzgebiete/nuembrecht.astro";
import { pagePaths } from "./routes";

/**
 * The view that renders each route from `pagePaths`, for both languages.
 *
 * `satisfies` makes TypeScript demand an entry for every path. Add a path in
 * `routes.ts` without a view here and the build fails.
 */
export const views = {
  anfrage: Anfrage,
  datenschutz: Datenschutz,
  "einsatzgebiete/gummersbach": Gummersbach,
  "einsatzgebiete/koeln": Koeln,
  "einsatzgebiete/nuembrecht": Nuembrecht,
  firmenfeier: Firmenfeier,
  hochzeitsfeier: Hochzeitsfeier,
  impressum: Impressum,
  "individuelles-catering": IndividuellesCatering,
  "messe-catering": MesseCatering,
  "mobile-cocktailbar": MobileCocktailbar,
} satisfies Record<keyof typeof pagePaths, unknown>;

/**
 * The homepage view, mounted by `src/pages/index.astro` for `/` and by the
 * router for `/en/`. It is not in `views` because it has no slug to translate.
 */
export const homeView = Home;
