import type { TrackEvent } from "./types/tracking";

declare global {
  interface Window {
    trackEvent?: TrackEvent;
  }
}

declare namespace Cloudflare {
  interface Env {
    CONTACT_TO_EMAIL?: string;
    RESEND_API_KEY?: string;
  }
}

export {};
