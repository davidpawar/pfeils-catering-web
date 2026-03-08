import type { TrackEvent } from "./types/tracking";

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare global {
  interface Window {
    trackEvent?: TrackEvent;
  }
}

declare namespace App {
  interface Locals extends Runtime {}
}

declare namespace Cloudflare {
  interface Env {
    RESEND_API_KEY?: string;
  }
}

export {};
