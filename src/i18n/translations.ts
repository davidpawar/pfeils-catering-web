import { de } from "./translations/de";
import { en } from "./translations/en";

export const languages = { de: "Deutsch", en: "English" } as const;
export const defaultLang = "de";
export const showDefaultLang = false;

export const ui = {
  de,
  en,
} as const;

// Route-Keys = DE-Pfade (da defaultLang), Values = EN-Pfade
export const routes = {
  en: {
    firmenfeier: "corporate",
    hochzeitsfeier: "wedding",
    "individuelles-catering": "individual-catering",
    "messe-catering": "exhibition",
    "mobile-cocktailbar": "mobile-cocktail-bar",
    anfrage: "contact",
    impressum: "imprint",
    datenschutz: "privacy",
    about: "about",
    blog: "blog",
  },
} as const;
