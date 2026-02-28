import type { ImageMetadata } from "astro";

import teamExperts from "../assets/images/team/team-experts.png";
import cocktailService from "../assets/images/catering/cocktail-service.jpg";
import firmenfeier from "../assets/images/events/firmenfeier.jpg";
import hochzeit from "../assets/images/events/hochzeit.jpg";
import messe from "../assets/images/events/messe.jpg";
import logo from "../assets/images/logo/logo-alt-weiss.png";
import headerBg from "../assets/images/hero/header-background.jpg";

/**
 * Image asset with src and alt text for consistent reuse across the site.
 */
export type ImageAsset = {
  src: ImageMetadata | string;
  alt: string;
};

export const imageProvider = {
  team: {
    teamExperts: {
      src: teamExperts,
      alt: "Erfahrenes Team von Pfeil's Catering mit Leidenschaft für Cocktails und Service",
    },
  },
  catering: {
    cocktailService: {
      src: cocktailService,
      alt: "Professioneller Barkeeper bei der Zubereitung von Cocktails auf einer Firmenveranstaltung",
    },
  },
  events: {
    firmenfeier: {
      src: firmenfeier,
      alt: "Cocktail-Bar bei einer Firmenfeier mit Gästen",
    },
    hochzeit: {
      src: hochzeit,
      alt: "Hochzeitsfeier mit stilvoller Cocktail-Bar",
    },
    messe: {
      src: messe,
      alt: "Mobile Cocktail-Bar auf einer Messe oder Großveranstaltung",
    },
  },
  logo: {
    altWeiss: {
      src: logo,
      alt: "Pfeil's Catering Logo – Cocktail-Catering Service",
    },
  },
  hero: {
    headerBackground: {
      src: headerBg,
      alt: "",
    },
  },
} as const;
