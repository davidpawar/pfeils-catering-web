import type { TrackEvent } from "./types/tracking";

declare global {
  interface Window {
    trackEvent?: TrackEvent;
  }
}

declare namespace Cloudflare {
  interface Env {
    RESEND_API_KEY?: string;
  }
}

export {};
