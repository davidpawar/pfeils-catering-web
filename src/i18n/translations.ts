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
    "hero.firmenfeier.title":
      "Ihr exklusives Cocktail Catering für unvergessliche Firmenfeiern",
    "hero.firmenfeier.subtitle": "Cocktail Catering",
    "hero.firmenfeier.description":
      "Wir übernehmen die Cocktails für Ihre nächste Firmenfeier",
    "hero.firmenfeier.paragraph":
      "Cocktails, die nicht nur schmecken, sondern begeistern. Unser Team bringt Bar-Feeling, Entertainment und Qualität direkt zu Ihrer Firmenfeier. So wird aus einem Event ein echtes Erlebnis.",
    "hero.firmenfeier.bullet1": "Geschmackvolle Cocktails",
    "hero.firmenfeier.bullet2": "Exzellenter Service",
    "hero.firmenfeier.bullet3": "Rundum-sorglos-Paket",
    "hero.firmenfeier.bullet4": "Glückliche Kunden",
    "hero.firmenfeier.imageAlt": "Thomas Pfeil beim Mixen eines Cocktails",
    "firmenfeier.gallery.badge": "Impressionen",
    "firmenfeier.gallery.title": "Cocktail Catering bei Firmenfeiern",
    "firmenfeier.gallery.description":
      "Einblicke in unsere Events – von der mobilen Bar bis zum professionellen Service.",
    "firmenfeier.gallery.image1.title": "Cocktail-Bar bei Ihrer Firmenfeier",
    "firmenfeier.gallery.image1.description":
      "Stilvolle Atmosphäre und professioneller Service – unsere mobile Bar bringt das Bar-Feeling direkt zu Ihrem Event. Gäste genießen exzellente Cocktails in entspannter Atmosphäre.",
    "firmenfeier.gallery.image2.title": "Professioneller Barkeeper-Service",
    "firmenfeier.gallery.image2.description":
      "Erfahrene Barkeeper sorgen für perfekte Drinks und einen reibungslosen Ablauf. Von Klassikern bis zu individuellen Kreationen – Qualität und Entertainment in einem.",
    "firmenfeier.gallery.image3.title": "Mobile Bambusbar",
    "firmenfeier.gallery.image3.description":
      "Unsere flexible Bambusbar ist der Blickfang auf jeder Veranstaltung. Hochwertige Ausstattung, die zu jedem Ambiente passt – indoor wie outdoor.",
    "firmenfeier.gallery.image4.title": "Atmosphäre bei Abendveranstaltungen",
    "firmenfeier.gallery.image4.description":
      "Bei Dunkelheit entfaltet sich die besondere Stimmung. Beleuchtete Bar, exzellente Cocktails und unser Team sorgen für unvergessliche Momente.",
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
    "hero.firmenfeier.title":
      "Your exclusive cocktail catering for unforgettable corporate events",
    "hero.firmenfeier.subtitle": "Cocktail Catering",
    "hero.firmenfeier.description":
      "We take care of the cocktails for your next corporate event",
    "hero.firmenfeier.paragraph":
      "Cocktails that don't just taste good – they impress. Our team brings bar atmosphere, entertainment and quality directly to your corporate event. Turn your event into a real experience.",
    "hero.firmenfeier.bullet1": "Tasty Cocktails",
    "hero.firmenfeier.bullet2": "Excellent Service",
    "hero.firmenfeier.bullet3": "All-inclusive Package",
    "hero.firmenfeier.bullet4": "Happy Customers",
    "hero.firmenfeier.imageAlt": "Thomas Pfeil mixing a cocktail",
    "firmenfeier.gallery.badge": "Impressions",
    "firmenfeier.gallery.title": "Cocktail catering at corporate events",
    "firmenfeier.gallery.description":
      "Insights into our events – from the mobile bar to professional service.",
    "firmenfeier.gallery.image1.title": "Cocktail bar at your corporate event",
    "firmenfeier.gallery.image1.description":
      "Elegant atmosphere and professional service – our mobile bar brings the bar feeling directly to your event. Guests enjoy excellent cocktails in a relaxed setting.",
    "firmenfeier.gallery.image2.title": "Professional bartender service",
    "firmenfeier.gallery.image2.description":
      "Experienced bartenders ensure perfect drinks and smooth operations. From classics to custom creations – quality and entertainment in one.",
    "firmenfeier.gallery.image3.title": "Mobile bamboo bar",
    "firmenfeier.gallery.image3.description":
      "Our flexible bamboo bar is the eye-catcher at any event. High-quality equipment that fits any setting – indoor and outdoor.",
    "firmenfeier.gallery.image4.title": "Atmosphere at evening events",
    "firmenfeier.gallery.image4.description":
      "In the evening, a special mood unfolds. Lit bar, excellent cocktails and our team create unforgettable moments.",
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
