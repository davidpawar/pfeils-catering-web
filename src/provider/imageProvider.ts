import type { ImageMetadata } from "astro";

import teamExperts from "../assets/images/team/team-experts.png";
import bambusbar from "../assets/images/catering/bambusbar.jpg";
import cocktailService from "../assets/images/catering/cocktail-service.jpg";
import firmenfeier from "../assets/images/events/firmenfeier.jpg";
import hochzeit from "../assets/images/events/hochzeit.jpg";
import messe from "../assets/images/events/messe.jpg";
import logo from "../assets/images/logo/logo-alt-weiss.png";
import headerBg from "../assets/images/hero/header-background.jpg";
import volksbank from "../assets/images/logos/volksbank.png";
import sparkasse from "../assets/images/logos/sparkasse.png";
import bmwKaltenbach from "../assets/images/logos/bmw-kaltenbach.png";
import schwalbe from "../assets/images/logos/schwalbe.svg";
import oni from "../assets/images/logos/oni.png";
import elektrisola from "../assets/images/logos/elektrisola.png";

/**
 * Image asset with src and alt text for consistent reuse across the site.
 * alt = German, altEn = English.
 */
export type ImageAsset = {
  src: ImageMetadata | string;
  alt: string;
  altEn?: string;
};

/**
 * Returns the alt text for the given language.
 */
export function getImageAlt(image: ImageAsset, lang: string): string {
  return lang === "en" && image.altEn ? image.altEn : image.alt;
}

export const imageProvider = {
  team: {
    teamExperts: {
      src: teamExperts,
      alt: "Erfahrenes Team von Pfeil's Catering mit Leidenschaft für Cocktails und Service",
      altEn: "Experienced team of Pfeil's Catering with a passion for cocktails and service",
    },
  },
  catering: {
    bambusbar: {
      src: bambusbar,
      alt: "Mobile Bambusbar von Pfeil's Catering bei einer Veranstaltung",
      altEn: "Mobile bamboo bar by Pfeil's Catering at an event",
    },
    cocktailService: {
      src: cocktailService,
      alt: "Professioneller Barkeeper bei der Zubereitung von Cocktails auf einer Firmenveranstaltung",
      altEn: "Professional bartender preparing cocktails at a corporate event",
    },
  },
  events: {
    firmenfeier: {
      src: firmenfeier,
      alt: "Cocktail-Bar bei einer Firmenfeier mit Gästen",
      altEn: "Cocktail bar at a corporate celebration with guests",
    },
    hochzeit: {
      src: hochzeit,
      alt: "Hochzeitsfeier mit stilvoller Cocktail-Bar",
      altEn: "Wedding celebration with elegant cocktail bar",
    },
    messe: {
      src: messe,
      alt: "Mobile Cocktail-Bar auf einer Messe oder Großveranstaltung",
      altEn: "Mobile cocktail bar at a trade fair or large event",
    },
  },
  logo: {
    altWeiss: {
      src: logo,
      alt: "Pfeil's Catering Logo – Cocktail-Catering Service",
      altEn: "Pfeil's Catering logo – cocktail catering service",
    },
  },
  hero: {
    headerBackground: {
      src: headerBg,
      alt: "",
      altEn: "",
    },
  },
  partners: {
    volksbank: {
      src: volksbank,
      alt: "Volksbank Oberberg – Partner von Pfeil's Catering",
      altEn: "Volksbank Oberberg – partner of Pfeil's Catering",
    },
    sparkasse: {
      src: sparkasse,
      alt: "Sparkasse KölnBonn, Geschäftsstelle Oberbergischer Kreis – Partner von Pfeil's Catering",
      altEn: "Sparkasse KölnBonn, Oberberg district branch – partner of Pfeil's Catering",
    },
    bmwKaltenbach: {
      src: bmwKaltenbach,
      alt: "BMW Kaltenbach Waldbröl – Partner von Pfeil's Catering",
      altEn: "BMW Kaltenbach Waldbröl – partner of Pfeil's Catering",
    },
    schwalbe: {
      src: schwalbe,
      alt: "Schwalbe Fahrradreifen – Partner von Pfeil's Catering",
      altEn: "Schwalbe bicycle tires – partner of Pfeil's Catering",
    },
    oni: {
      src: oni,
      alt: "ONI – Partner von Pfeil's Catering",
      altEn: "ONI – partner of Pfeil's Catering",
    },
    elektrisola: {
      src: elektrisola,
      alt: "Elektrisola – Partner von Pfeil's Catering",
      altEn: "Elektrisola – partner of Pfeil's Catering",
    },
  },
} as const;
