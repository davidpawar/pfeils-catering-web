import type { ImageMetadata } from "astro";

import bambusbar from "../assets/images/catering/bambusbar.jpg";
import bambusbarAbend from "../assets/images/catering/bambusbar-abend.jpg";
import bmwKaltenbach from "../assets/images/logos/bmw-kaltenbach.png";
import cocktailService from "../assets/images/catering/cocktail-service.jpg";
import eisCatering from "../assets/images/catering/eis-catering.jpg";
import elektrisola from "../assets/images/logos/elektrisola.png";
import firmenfeier from "../assets/images/events/firmenfeier.jpg";
import headerBg from "../assets/images/hero/header-background.jpg";
import hochzeit from "../assets/images/events/hochzeit.jpg";
import hochzeitWedding from "../assets/images/events/hochzeit-wedding.jpg";
import logo from "../assets/images/logo/logo-alt-weiss.png";
import messe from "../assets/images/events/messe.jpg";
import oni from "../assets/images/logos/oni.png";
import schwalbe from "../assets/images/logos/schwalbe.svg";
import sparkasse from "../assets/images/logos/sparkasse.png";
import teamExperts from "../assets/images/team/team-experts.png";
import volksbank from "../assets/images/logos/volksbank.png";
import weddingHero from "../assets/images/hero/wedding-hero.jpg";
import weihnachtsfeier from "../assets/images/events/weihnachtsfeier.jpg";

/**
 * Image asset with src and alt text for consistent reuse across the site.
 * alt = German, altEn = English.
 */
export type ImageAsset = {
  alt: string;
  altEn?: string;
  src: ImageMetadata | string;
};

/**
 * Returns the alt text for the given language.
 */
export function getImageAlt(image: ImageAsset, lang: string): string {
  return lang === "en" && image.altEn ? image.altEn : image.alt;
}

export const imageProvider = {
  catering: {
    bambusbar: {
      alt: "Mobile Bambusbar von Pfeil's Catering bei einer Veranstaltung",
      altEn: "Mobile bamboo bar by Pfeil's Catering at an event",
      src: bambusbar,
    },
    bambusbarAbend: {
      alt: "Bambusbar von Pfeil's Catering bei einer Abendveranstaltung",
      altEn: "Bamboo bar by Pfeil's Catering at an evening event",
      src: bambusbarAbend,
    },
    cocktailService: {
      alt: "Professioneller Barkeeper bei der Zubereitung von Cocktails auf einer Firmenveranstaltung",
      altEn: "Professional bartender preparing cocktails at a corporate event",
      src: cocktailService,
    },
    eisCatering: {
      alt: "Eis-Catering von Pfeil's Catering bei einer Firmenfeier",
      altEn: "Ice cream catering by Pfeil's Catering at a corporate event",
      src: eisCatering,
    },
  },
  events: {
    firmenfeier: {
      alt: "Cocktail-Bar bei einer Firmenfeier mit Gästen",
      altEn: "Cocktail bar at a corporate celebration with guests",
      src: firmenfeier,
    },
    hochzeit: {
      alt: "Hochzeitsfeier mit stilvoller Cocktail-Bar",
      altEn: "Wedding celebration with elegant cocktail bar",
      src: hochzeit,
    },
    hochzeitWedding: {
      alt: "Cocktail-Bar bei einer Hochzeitsfeier mit Gästen",
      altEn: "Cocktail bar at a wedding celebration with guests",
      src: hochzeitWedding,
    },
    messe: {
      alt: "Mobile Cocktail-Bar auf einer Messe oder Großveranstaltung",
      altEn: "Mobile cocktail bar at a trade fair or large event",
      src: messe,
    },
    weihnachtsfeier: {
      alt: "Mobiler Weihnachtsmarkt bei einer Firmenfeier",
      altEn: "Mobile Christmas market at a corporate event",
      src: weihnachtsfeier,
    },
  },
  hero: {
    headerBackground: {
      alt: "",
      altEn: "",
      src: headerBg,
    },
    weddingBackground: {
      alt: "Hochzeitsfeier mit Cocktail-Catering – festliche Atmosphäre",
      altEn: "Wedding celebration with cocktail catering – festive atmosphere",
      src: weddingHero,
    },
  },
  logo: {
    altWeiss: {
      alt: "Pfeil's Catering Logo – Cocktail-Catering Service",
      altEn: "Pfeil's Catering logo – cocktail catering service",
      src: logo,
    },
  },
  partners: {
    bmwKaltenbach: {
      alt: "BMW Kaltenbach Waldbröl – Partner von Pfeil's Catering",
      altEn: "BMW Kaltenbach Waldbröl – partner of Pfeil's Catering",
      src: bmwKaltenbach,
    },
    elektrisola: {
      alt: "Elektrisola – Partner von Pfeil's Catering",
      altEn: "Elektrisola – partner of Pfeil's Catering",
      src: elektrisola,
    },
    oni: {
      alt: "ONI – Partner von Pfeil's Catering",
      altEn: "ONI – partner of Pfeil's Catering",
      src: oni,
    },
    schwalbe: {
      alt: "Schwalbe Fahrradreifen – Partner von Pfeil's Catering",
      altEn: "Schwalbe bicycle tires – partner of Pfeil's Catering",
      src: schwalbe,
    },
    sparkasse: {
      alt: "Sparkasse KölnBonn, Geschäftsstelle Oberbergischer Kreis – Partner von Pfeil's Catering",
      altEn:
        "Sparkasse KölnBonn, Oberberg district branch – partner of Pfeil's Catering",
      src: sparkasse,
    },
    volksbank: {
      alt: "Volksbank Oberberg – Partner von Pfeil's Catering",
      altEn: "Volksbank Oberberg – partner of Pfeil's Catering",
      src: volksbank,
    },
  },
  team: {
    teamExperts: {
      alt: "Erfahrenes Team von Pfeil's Catering mit Leidenschaft für Cocktails und Service",
      altEn:
        "Experienced team of Pfeil's Catering with a passion for cocktails and service",
      src: teamExperts,
    },
  },
} as const;
