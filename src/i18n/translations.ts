export const languages = { de: "Deutsch", en: "English" } as const;
export const defaultLang = "de";
export const showDefaultLang = false;

export const ui = {
  de: {
    "nav.home": "Startseite",
    "nav.firmenfeier": "Firmenfeier",
    "nav.hochzeitsfeier": "Hochzeitsfeier",
    "nav.messeCatering": "Messe Catering",
    "nav.mobileCocktailbar": "Mobile Cocktailbar",
    "nav.anfrage": "Jetzt anfragen",
    "nav.about": "Über uns",
    "nav.blog": "Blog",
    "nav.impressum": "Impressum",
    "nav.datenschutz": "Datenschutz",
    "hero.title": "Dein Cocktail-Catering Service",
    "hero.subtitle":
      "Pfeil's Cocktail Catering – mit Herz gemixt, für dich und deine Gäste.",
    "hero.cta": "Jetzt anfragen",
    "footer.quickLinks": "Schnellzugriff",
    "footer.contact": "Kontakt",
    "footer.tagline":
      "Mit Herz gemixt, für dich und deine Gäste. Professionelles Cocktail-Catering für unvergessliche Events seit 2008.",
    "footer.copyright": "Alle Rechte vorbehalten.",
  },
  en: {
    "nav.home": "Home",
    "nav.firmenfeier": "Corporate Events",
    "nav.hochzeitsfeier": "Wedding",
    "nav.messeCatering": "Exhibition",
    "nav.mobileCocktailbar": "Mobile Cocktail Bar",
    "nav.anfrage": "Contact",
    "nav.about": "About",
    "nav.blog": "Blog",
    "nav.impressum": "Imprint",
    "nav.datenschutz": "Privacy",
    "hero.title": "Your Cocktail Catering Service",
    "hero.subtitle":
      "Pfeil's Cocktail Catering – mixed with heart, for you and your guests.",
    "hero.cta": "Contact us",
    "footer.quickLinks": "Quick Links",
    "footer.contact": "Contact",
    "footer.tagline":
      "Mixed with heart, for you and your guests. Professional cocktail catering for unforgettable events since 2008.",
    "footer.copyright": "All rights reserved.",
  },
} as const;

// Route-Keys = DE-Pfade (da defaultLang), Values = EN-Pfade
export const routes = {
  en: {
    firmenfeier: "corporate",
    hochzeitsfeier: "wedding",
    "messe-catering": "exhibition",
    "mobile-cocktailbar": "mobile-cocktail-bar",
    anfrage: "contact",
    impressum: "imprint",
    datenschutz: "privacy",
    about: "about",
    blog: "blog",
  },
} as const;
