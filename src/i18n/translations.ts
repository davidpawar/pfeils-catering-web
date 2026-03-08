import { de } from "./translations/de";
import { en } from "./translations/en";

export const languages = { de: "Deutsch", en: "English" } as const;
export const defaultLang = "de";
export const showDefaultLang = false;

export const ui = {
  de,
  en,
} as const;

// Route-Keys = DE-Pfade (flattened, ohne Slash), Values = EN-Pfade
// canonicalPaths: Maps flattened key → path with slashes for LanguagePicker
export const canonicalPaths: Record<string, string> = {
  einsatzgebietekoeln: "einsatzgebiete/koeln",
  einsatzgebietegummersbach: "einsatzgebiete/gummersbach",
};

export const routes = {
  en: {
    firmenfeier: "corporate",
    hochzeitsfeier: "wedding",
    "individuelles-catering": "individual-catering",
    "messe-catering": "exhibition",
    "mobile-cocktailbar": "mobile-cocktail-bar",
    einsatzgebietekoeln: "service-areas/cologne",
    einsatzgebietegummersbach: "service-areas/gummersbach",
    anfrage: "contact",
    impressum: "imprint",
    datenschutz: "privacy",
    blog: "blog",
  },
} as const;
