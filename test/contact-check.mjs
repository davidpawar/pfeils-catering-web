/**
 * Checks the contact form against the local backend.
 *
 * `npm run check` runs this after the build. It starts `astro preview`, which
 * serves the worker that handles `/api/contact`, and posts the form there.
 * The pages in `dist/client` must still show that same form.
 *
 * Incomplete posts are rejected by the worker and never reach Resend. One
 * complete post is sent. The inquiry goes to CONTACT_TO_EMAIL, and the
 * confirmation uses that same address so both mails stay with the owner.
 *
 * What it checks:
 * - German and English contact pages post to `/api/contact`
 * - name, email, and message stay required in the markup
 * - the local worker rejects a blank name and a missing message
 * - a body that is not a form is an error from that same worker
 * - a complete post is accepted and the worker reports it as sent
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

/**
 * Absolute path of the repository root (the folder that contains package.json).
 */
const root = path.resolve(import.meta.dirname, "..");

/**
 * Human-readable problems. We collect them all so one run shows every failure.
 */
const errors = [];

/**
 * Records one problem without stopping the script.
 *
 * Later checks still run, so a junior sees the full list instead of fixing
 * one error, re-running, and discovering the next one.
 *
 * @param {string} message - What is wrong, including the page or the case.
 */
function addError(message) {
  errors.push(message);
}

/**
 * Picks a free localhost port for the preview.
 *
 * The dev server may already be on 4321. Binding to port 0 lets the OS choose
 * one, then we release it so the preview can take it.
 *
 * @returns {Promise<number>}
 */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    // port 0 asks the OS for any free port.
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      // close our socket so the preview can bind the same port.
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

/**
 * Starts the built site, including the contact worker route.
 *
 * Output is kept so a failed start can be shown. The process is its own
 * group, so stopping it also stops the worker it spawns.
 *
 * @param {number} port
 * @returns {import("node:child_process").ChildProcess & { log: string }}
 */
function startPreview(port) {
  const child = spawn(
    "npx",
    ["astro", "preview", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: root,
      // own process group, so one signal stops preview and the worker.
      detached: true,
      // windows needs a shell to find npx.
      shell: process.platform === "win32",
      // keep stdout and stderr for the startup error.
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.log = "";
  const keep = (chunk) => {
    // only the tail matters when startup fails.
    child.log = `${child.log}${chunk}`.slice(-4000);
  };
  child.stdout?.on("data", keep);
  child.stderr?.on("data", keep);
  return child;
}

/**
 * Waits until the preview answers, or fails with the log tail.
 *
 * @param {string} origin
 * @param {{ log: string }} preview
 */
async function waitForPreview(origin, preview) {
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // the worker is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Local preview did not start.\n${preview.log}`);
}

/**
 * Stops the preview and the worker it started.
 *
 * @param {import("node:child_process").ChildProcess | undefined} preview
 */
function stopPreview(preview) {
  if (!preview?.pid) return;

  try {
    // negative pid targets the whole process group, not only npx.
    process.kill(-preview.pid, "SIGTERM");
  } catch {
    try {
      preview.kill("SIGTERM");
    } catch {
      // already gone.
    }
  }
}

/**
 * Posts one form to the local contact route.
 *
 * The worker rejects a form post that has no Origin. The browser sends the
 * page's own origin, so the test does the same.
 *
 * @param {string} origin
 * @param {Record<string, string>} fields
 */
async function submit(origin, fields) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);

  const response = await fetch(`${origin}/api/contact`, {
    body: form,
    headers: { Origin: origin },
    method: "POST",
  });
  // a non-json body still counts as a failed check, not a crash.
  const json = await response.json().catch(() => ({}));
  return { json, status: response.status };
}

/**
 * Checks one built contact page still contains a working form.
 *
 * The markup is what the visitor gets. A renamed field or a form that no
 * longer posts to the API fails here, before any request is made.
 *
 * @param {string} relativeFile
 * @param {string} privacyHref
 */
function checkRenderedForm(relativeFile, privacyHref) {
  const file = path.join(root, relativeFile);
  if (!fs.existsSync(file)) {
    addError(`${relativeFile} is missing. Run the build first.`);
    return;
  }

  const html = fs.readFileSync(file, "utf8");
  // the form tag is the no-js fallback; the script below is what the page actually uses.
  if (!html.includes('id="contact-form" action="/api/contact" method="POST"')) {
    addError(`${relativeFile} form does not post to /api/contact`);
  }
  // the build may rewrite quotes, so both " and ` count.
  if (!/fetch\([`'"]\/api\/contact[`'"]/.test(html)) {
    addError(`${relativeFile} script does not submit to /api/contact`);
  }
  // german stays on /datenschutz/, english must point at /en/privacy/.
  if (!html.includes(`href="${privacyHref}"`)) {
    addError(`${relativeFile} privacy link is not ${privacyHref}`);
  }

  // message is a textarea, so it has no type to check.
  const required = [
    ["name", "text"],
    ["email", "email"],
    ["message", ""],
  ];
  for (const [name, type] of required) {
    const tag = html.match(new RegExp(`<(?:input|textarea)[^>]*name="${name}"[^>]*>`))?.[0];
    if (!tag) {
      addError(`${relativeFile} is missing the ${name} field`);
      // skip the required and type checks for a field that is not there.
      continue;
    }
    if (!tag.includes("required")) addError(`${relativeFile} ${name} is not required`);
    if (type && !tag.includes(`type="${type}"`)) {
      addError(`${relativeFile} ${name} is not type ${type}`);
    }
  }

  for (const name of ["date", "guests", "location", "phone", "source"]) {
    if (!html.includes(`name="${name}"`)) addError(`${relativeFile} is missing the ${name} field`);
  }
}

/**
 * Reads the inbox the local worker uses for inquiry emails.
 *
 * Preview uses the top-level `vars` in wrangler.jsonc. The confirmation is
 * sent to the address in the form, so the test reuses this one.
 *
 * @returns {string}
 */
function contactInbox() {
  const source = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
  // the first match is the local var; prod is a later one and is not used here.
  const inbox = source.match(/"CONTACT_TO_EMAIL":\s*"([^"]+)"/)?.[1];
  if (!inbox) throw new Error("Could not read CONTACT_TO_EMAIL from wrangler.jsonc");
  return inbox;
}

/**
 * Checks the worker's answers, then sends one real inquiry.
 *
 * Rejections happen first. The complete post is last, so a broken worker
 * fails before a mail goes out.
 *
 * @param {string} origin
 */
async function checkApi(origin) {
  // spaces trim to empty, so this must fail before any mail is sent.
  const blankName = await submit(origin, {
    email: "gast@example.com",
    message: "Hallo",
    name: "  ",
  });
  if (blankName.status !== 400 || blankName.json.message !== "Bitte geben Sie Name und E-Mail an.") {
    addError(`Blank name should be rejected, got ${blankName.status} ${blankName.json.message ?? ""}`);
  }

  // name and email are present, so only the empty message should be rejected.
  const missingMessage = await submit(origin, {
    email: "gast@example.com",
    message: "",
    name: "Anna",
  });
  if (
    missingMessage.status !== 400 ||
    missingMessage.json.message !== "Bitte geben Sie eine Nachricht an."
  ) {
    addError(
      `Missing message should be rejected, got ${missingMessage.status} ${missingMessage.json.message ?? ""}`,
    );
  }

  // json is not form data, so the worker should hit its catch and return 500.
  const broken = await fetch(`${origin}/api/contact`, {
    body: "{}",
    headers: { "Content-Type": "application/json", Origin: origin },
    method: "POST",
  });
  if (broken.status !== 500) {
    addError(`A body that is not a form should be an error, got ${broken.status}`);
  }

  const inbox = contactInbox();
  // email is the inbox too, so the confirmation does not go to a stranger.
  const sent = await submit(origin, {
    date: "2026-06-01",
    email: inbox,
    guests: "1",
    location: "Lokaltest",
    message: "Automatischer Test des Kontaktformulars. Keine echte Anfrage.",
    name: "Kontaktformular-Test",
    phone: "0178 498 85 21",
    source: "sonstiges",
  });
  if (sent.status !== 200 || sent.json.message !== "Vielen Dank! Ihre Nachricht wurde gesendet.") {
    addError(`A complete form should be sent, got ${sent.status} ${sent.json.message ?? ""}`);
  }
}

/**
 * Reads the built pages, then posts to the local preview.
 */
async function main() {
  checkRenderedForm("dist/client/anfrage/index.html", "/datenschutz/");
  checkRenderedForm("dist/client/en/contact/index.html", "/en/privacy/");

  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const preview = startPreview(port);
  const stop = () => stopPreview(preview);
  // ctrl-c would otherwise leave the preview running.
  process.on("SIGINT", () => {
    stop();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    stop();
    process.exit(143);
  });

  try {
    await waitForPreview(origin, preview);
    await checkApi(origin);
  } catch (error) {
    addError(error instanceof Error ? error.message : String(error));
  } finally {
    // stop the preview even when a check failed.
    stop();
  }

  if (errors.length > 0) {
    console.error(`Contact form check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log("Contact form check passed.");
}

await main();
