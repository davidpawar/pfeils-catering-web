import type { APIRoute } from "astro";
import type { TrackingEventProps } from "../../types/tracking";

export const prerender = false;

const BLOCKED_HOSTS = new Set<string>([]);
const PLAUSIBLE_ENDPOINT = "https://plausible.io/api/event";

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

  // Only keep values that match the AnalyticsProps value type.
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

  // After filtering, we know the remaining values fit the allowed prop types.
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

    // Local and internal hosts should not generate real analytics events.
    if (BLOCKED_HOSTS.has(requestHost)) {
      return new Response(null, { status: 204 });
    }

    const body = (await request
      .json()
      .catch(() => null)) as AnalyticsRequestBody | null;

    // If parsing fails, `body` becomes null and the request is rejected below.
    // Plausible needs at least an event name and URL to process the event.
    if (
      !body ||
      typeof body.name !== "string" ||
      typeof body.url !== "string"
    ) {
      return createJSONResponse({ message: "Invalid analytics payload." }, 400);
    }

    const trackedUrl = new URL(body.url);
    const trackedHost = trackedUrl.hostname.toLowerCase();

    // Events targeting blocked hosts are also ignored without an error.
    if (BLOCKED_HOSTS.has(trackedHost)) {
      return new Response(null, { status: 204 });
    }

    // Prefer the configured site domain, then the payload domain, then the tracked host.
    const normalizedDomain = site?.hostname ?? body.domain ?? trackedHost;
    const plausibleProps = sanitizeProps(body.props) ?? {};

    // Forward the language as an extra property so reports can be segmented by locale.
    if (body.lang) {
      plausibleProps.lang = body.lang;
    }

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent":
        request.headers.get("user-agent") ??
        "Pfeils-Catering-Analytics-Proxy/1.0",
    };

    // Forward the client IP when available.
    // This helps Plausible keep geo/visitor attribution accurate behind a proxy or CDN.
    const clientIpHeader =
      request.headers.get("CF-Connecting-IP") ??
      request.headers.get("x-forwarded-for");

    if (clientIpHeader) {
      // Plausible expects the forwarded client IP in this header.
      requestHeaders["X-Forwarded-For"] = clientIpHeader;
    }

    // This is the actual server-to-server forwarding call to Plausible.
    const plausibleResponse = await fetch(PLAUSIBLE_ENDPOINT, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        domain: normalizedDomain,
        name: body.name,
        props:
          // Omit empty props objects so the payload stays minimal.
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

    // Pass through Plausible's status, headers, and body.
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
