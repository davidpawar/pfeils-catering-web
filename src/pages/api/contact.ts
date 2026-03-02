import type { APIRoute } from "astro";

export const prerender = false;

// Maps form values for "Where did you hear about us?" to readable labels.
const SOURCE_LABELS: Record<string, string> = {
  empfehlung: "Empfehlung",
  google: "Google",
  messe: "Messe / Event",
  "social-media": "Social Media",
  sonstiges: "Sonstiges",
};

// Shared CSS styles for both email templates (internal + confirmation).
const EMAIL_LAYOUT = {
  card: "background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.08),0 2px 4px -2px rgba(0,0,0,0.06)",
  container: "max-width:560px;margin:0 auto;padding:32px 16px",
  content: "padding:28px 24px",
  detailRow:
    "margin:0 0 16px;padding:12px 16px;background:#f8fafc;border-left:4px solid #0041c2;border-radius:0 8px 8px 0",
  divider: "margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0",
  header: "background:#0041c2;padding:28px 24px;text-align:center",
  headerTitle:
    "margin:0;font-size:22px;font-weight:600;color:#fff;letter-spacing:-0.02em",
  label:
    "font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 4px",
  messageBlock:
    "margin:24px 0;padding:16px 20px;background:#f8fafc;border-left:4px solid #0041c2;border-radius:0 8px 8px 0",
  messageText:
    "margin:0;font-size:15px;line-height:1.6;color:#334155;white-space:pre-wrap",
  value: "font-size:16px;font-weight:600;color:#0041c2;margin:0",
  wrapper:
    "margin:0;font-family:'Segoe UI',system-ui,sans-serif;line-height:1.6;color:#334155;background:#f1f5f9",
} as const;

/**
 * Builds the HTML body for the confirmation email sent to the customer.
 * Includes greeting, form data (guests, date, location, source), the customer's message,
 * and Pfeils Catering contact details.
 */
function buildConfirmationEmailHtml(data: {
  date?: string;
  email: string;
  guests?: string;
  location?: string;
  message?: string;
  name: string;
  source?: string;
}): string {
  const details: string[] = [];
  if (data.date) details.push(buildDetailRow("Datum", data.date));
  if (data.guests) details.push(buildDetailRow("Gästeanzahl", data.guests));
  if (data.location)
    details.push(buildDetailRow("Veranstaltungsort", data.location));
  if (data.source) {
    const label = SOURCE_LABELS[data.source] ?? data.source;
    details.push(buildDetailRow("Woher kennen Sie uns?", label));
  }
  const detailsHtml = details.length > 0 ? details.join("") : "";

  const messageBlock = data.message
    ? `
  <div style="${EMAIL_LAYOUT.messageBlock}">
    <p style="${EMAIL_LAYOUT.label}">Ihre Nachricht</p>
    <p style="${EMAIL_LAYOUT.messageText}">${escapeHtml(data.message)}</p>
  </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ihre Anfrage bei Pfeils Catering</title></head>
<body style="${EMAIL_LAYOUT.wrapper}">
  <div style="${EMAIL_LAYOUT.container}">
    <div style="${EMAIL_LAYOUT.card}">
      <div style="${EMAIL_LAYOUT.header}">
        <h1 style="${EMAIL_LAYOUT.headerTitle}">Vielen Dank für Ihre Anfrage!</h1>
      </div>
      <div style="${EMAIL_LAYOUT.content}">
        <p style="margin:0 0 16px;font-size:16px">Hallo ${escapeHtml(data.name)},</p>
        <p style="margin:0 0 24px;font-size:15px">wir haben Ihre Nachricht erhalten und melden uns in Kürze bei Ihnen.</p>
        ${detailsHtml}
        ${messageBlock}
        <div style="${EMAIL_LAYOUT.divider}">
          <p style="margin:0 0 8px;font-size:14px;color:#64748b">Bei dringenden Fragen erreichen Sie uns unter</p>
          <p style="margin:0;font-size:18px;font-weight:600;color:#0041c2">0178 498 85 21</p>
          <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">Mo–Fr 09:00 – 18:00</p>
        </div>
        <p style="margin:24px 0 0;font-size:15px">Mit freundlichen Grüßen<br><strong style="color:#0041c2">Ihr Team von Pfeils Catering</strong></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Creates a single detail block (label + value) for email templates.
 * Uses the shared layout with grey background and blue border.
 */
function buildDetailRow(label: string, value: string): string {
  return `
  <div style="${EMAIL_LAYOUT.detailRow}">
    <p style="${EMAIL_LAYOUT.label}">${escapeHtml(label)}</p>
    <p style="${EMAIL_LAYOUT.value}">${escapeHtml(value)}</p>
  </div>`;
}

/**
 * Builds the HTML body for the internal email to info@pfeils-catering.de.
 * Contains all form data in the shared layout.
 */
function buildEmailHtml(data: {
  date?: string;
  email: string;
  guests?: string;
  location?: string;
  message?: string;
  name: string;
  source?: string;
}): string {
  const emailLink = `<a href="mailto:${escapeHtml(data.email)}" style="color:#0041c2;text-decoration:none">${escapeHtml(data.email)}</a>`;
  const rows: string[] = [
    buildDetailRow("Name", data.name),
    `<div style="${EMAIL_LAYOUT.detailRow}"><p style="${EMAIL_LAYOUT.label}">E-Mail</p><p style="${EMAIL_LAYOUT.value}">${emailLink}</p></div>`,
  ];
  if (data.date) rows.push(buildDetailRow("Datum", data.date));
  if (data.guests) rows.push(buildDetailRow("Gästeanzahl", data.guests));
  if (data.location)
    rows.push(buildDetailRow("Veranstaltungsort", data.location));
  if (data.source) {
    const label = SOURCE_LABELS[data.source] ?? data.source;
    rows.push(buildDetailRow("Woher kennen Sie uns?", label));
  }
  const messageBlock = data.message
    ? `
  <div style="${EMAIL_LAYOUT.messageBlock}">
    <p style="${EMAIL_LAYOUT.label}">Nachricht</p>
    <p style="${EMAIL_LAYOUT.messageText}">${escapeHtml(data.message)}</p>
  </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kontaktanfrage</title></head>
<body style="${EMAIL_LAYOUT.wrapper}">
  <div style="${EMAIL_LAYOUT.container}">
    <div style="${EMAIL_LAYOUT.card}">
      <div style="${EMAIL_LAYOUT.header}">
        <h1 style="${EMAIL_LAYOUT.headerTitle}">Neue Kontaktanfrage</h1>
      </div>
      <div style="${EMAIL_LAYOUT.content}">
        ${rows.join("")}
        ${messageBlock}
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escapes HTML special characters to prevent XSS in email content.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Creates a JSON response with optional HTTP status.
 */
const createJSONResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });

/**
 * POST handler for the contact form.
 * Sends 1) an email to info@pfeils-catering.de and 2) a confirmation email to the customer.
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const formData = await request.formData();
    const date = (formData.get("date") as string | null)?.trim() || undefined;
    const email = (formData.get("email") as string | null)?.trim();
    const guests =
      (formData.get("guests") as string | null)?.trim() || undefined;
    const location =
      (formData.get("location") as string | null)?.trim() || undefined;
    const message =
      (formData.get("message") as string | null)?.trim() || undefined;
    const name = (formData.get("name") as string | null)?.trim();
    const source =
      (formData.get("source") as string | null)?.trim() || undefined;

    if (!name || !email) {
      return createJSONResponse(
        { message: "Bitte geben Sie Name und E-Mail an." },
        400,
      );
    }

    const apiKey = locals.runtime?.env?.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured");
      return createJSONResponse(
        { message: "E-Mail-Versand ist derzeit nicht konfiguriert." },
        500,
      );
    }

    // 1. Email to info@pfeils-catering.de
    const res = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: "Pfeils Catering <kontakt@notification.pfeils-catering.de>",
        html: buildEmailHtml({
          date,
          email,
          guests,
          location,
          message,
          name,
          source,
        }),
        reply_to: email,
        subject: `Kontaktanfrage von ${name}`,
        to: ["info@pfeils-catering.de"],
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      method: "POST",
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend API error:", res.status, errBody);
      return createJSONResponse(
        {
          message:
            "Beim Versenden ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        },
        500,
      );
    }

    // 2. Confirmation email to customer (errors are only logged, not returned to client)
    const confirmationRes = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: "Pfeils Catering <kontakt@notification.pfeils-catering.de>",
        html: buildConfirmationEmailHtml({
          date,
          email,
          guests,
          location,
          message,
          name,
          source,
        }),
        subject: "Ihre Anfrage bei Pfeils Catering",
        to: [email],
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      method: "POST",
    });

    if (!confirmationRes.ok) {
      const errBody = await confirmationRes.text();
      console.error(
        "Resend confirmation email error:",
        confirmationRes.status,
        errBody,
      );
    }

    return createJSONResponse({
      message: "Vielen Dank! Ihre Nachricht wurde gesendet.",
    });
  } catch (err) {
    console.error("Contact form error:", err);
    return createJSONResponse(
      {
        message:
          "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
      },
      500,
    );
  }
};
