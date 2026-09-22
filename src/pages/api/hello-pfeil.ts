import type { APIRoute } from "astro";
import type { TrackingEventProps } from "../../types/tracking";

/**
 * Rendered per request: this is a proxy endpoint, not a page.
 */
export const prerender = false;

/**
 * Hosts whose traffic must never reach Plausible, so stats stay clean.
 */
const BLOCKED_HOSTS = new Set<string>(["localhost", "dev.pfeils-catering.de"]);

/**
 * Plausible's server-side event API.
 */
const PLAUSIBLE_ENDPOINT = "https://plausible.io/api/event";

/**
 * The payload `window.trackEvent` sends to this endpoint.
 */
type AnalyticsRequestBody = {
  domain?: string;
  lang?: string;
  name?: string;
  props?: TrackingEventProps;
  referrer?: string;
  url?: string;
};

/**
 * Builds a standardized JSON response so validation and error messages
 * are returned consistently from one place.
 */
function createJSONResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

/**
 * Checks whether the given value is a plain object.
 * Arrays and `null` are excluded because we only allow key-value maps here.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Removes analytics props that should not be forwarded to Plausible.
 * Only primitive values and `null` are allowed to remain.
 */
function sanitizeProps(value: unknown): TrackingEventProps | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  // keep only values that match the allowed prop types.
  const sanitizedEntries = Object.entries(value).filter(([, propValue]) => {
    return (
      propValue === null ||
      typeof propValue === "string" ||
      typeof propValue === "number" ||
      typeof propValue === "boolean"
    );
  });

  if (sanitizedEntries.length === 0) {
    return undefined;
  }

  // the filter above guarantees the remaining values fit the prop types.
  return Object.fromEntries(sanitizedEntries) as TrackingEventProps;
}

/**
 * Receives analytics events from the frontend, validates the basic shape,
 * and forwards them to Plausible. This keeps the frontend independent from
 * the external API and gives us one place to enforce safeguards.
 */
export const POST: APIRoute = async ({ request, site }) => {
  try {
    const requestHost = new URL(request.url).hostname.toLowerCase();

    // local and internal hosts must not generate real analytics events.
    if (BLOCKED_HOSTS.has(requestHost)) {
      return new Response(null, { status: 204 });
    }

    /**
     * Parsed payload. An unparseable body becomes null and is rejected below.
     */
    const body = (await request
      .json()
      .catch(() => null)) as AnalyticsRequestBody | null;

    // a failed parse leaves body null. Plausible needs at least a name and a URL.
    if (
      !body ||
      typeof body.name !== "string" ||
      typeof body.url !== "string"
    ) {
      return createJSONResponse({ message: "Invalid analytics payload." }, 400);
    }

    const trackedUrl = new URL(body.url);
    const trackedHost = trackedUrl.hostname.toLowerCase();

    // events aimed at blocked hosts are dropped silently, without an error.
    if (BLOCKED_HOSTS.has(trackedHost)) {
      return new Response(null, { status: 204 });
    }

    // prefer the configured site domain, then the payload domain, then the tracked host.
    const normalizedDomain = site?.hostname ?? body.domain ?? trackedHost;
    const plausibleProps = sanitizeProps(body.props) ?? {};

    // send the language along so reports can be split by locale.
    if (body.lang) {
      plausibleProps.lang = body.lang;
    }

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent":
        request.headers.get("user-agent") ??
        "Pfeils-Catering-Analytics-Proxy/1.0",
    };

    // forward the client IP so geo and visitor attribution survive the proxy.
    const clientIpHeader =
      request.headers.get("CF-Connecting-IP") ??
      request.headers.get("x-forwarded-for");

    if (clientIpHeader) {
      // this header is where Plausible reads the forwarded client IP.
      requestHeaders["X-Forwarded-For"] = clientIpHeader;
    }

    // the actual server-to-server call to Plausible.
    const plausibleResponse = await fetch(PLAUSIBLE_ENDPOINT, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        domain: normalizedDomain,
        name: body.name,
        props:
          // omit an empty props object so the payload stays minimal.
          Object.keys(plausibleProps).length > 0 ? plausibleProps : undefined,
        referrer: body.referrer,
        url: trackedUrl.toString(),
      }),
    });

    const responseBody = await plausibleResponse.text();

    if (!plausibleResponse.ok) {
      console.error(
        "Plausible forwarding error:",
        plausibleResponse.status,
        responseBody,
      );
    }

    // pass Plausible's status, headers, and body straight back.
    return new Response(responseBody, {
      status: plausibleResponse.status,
      statusText: plausibleResponse.statusText,
      headers: plausibleResponse.headers,
    });
  } catch (error) {
    console.error("Analytics event error:", error);
    return createJSONResponse({ message: "Analytics request failed." }, 500);
  }
};
