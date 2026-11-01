// Blog sign-up: adds an email to the Mandarin Hero blog's Resend segment for its language.
// scripts/send_new_posts.py emails each new post to that segment.
// Fetch (Accept: application/json) gets JSON back; a plain form post is sent back to the page,
// at #subscribed or #subscribe-error.

const SEGMENTS = {
  en: "10a16077-f4a4-4e44-98a4-ffef0adb4874", // Mandarin Hero blog (English)
  nl: "77fcc81a-e0df-4274-b309-b446be163a5d", // Mandarin Hero blog (Dutch)
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const config = { path: "/api/blog-subscribe" };

async function resend(method, path, body) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://api.resend.com${path}`, {
      method,
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: body && JSON.stringify(body),
    });
    if (res.status !== 429 && res.status < 500) return res;
    await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
  }
  throw new Error(`Resend ${method} ${path} kept failing`);
}

async function subscribe(email, lang) {
  const segment = SEGMENTS[lang];
  const contact = encodeURIComponent(email);
  // Create is an upsert. Adding the segment and clearing "unsubscribed" covers someone signing up again.
  const steps = [
    ["POST", "/contacts", { email, unsubscribed: false, segments: [{ id: segment }] }],
    ["POST", `/contacts/${contact}/segments/${segment}`],
    ["PATCH", `/contacts/${contact}`, { unsubscribed: false }],
  ];
  for (const [method, path, body] of steps) {
    const res = await resend(method, path, body);
    if (!res.ok) throw new Error(`Resend ${method} ${path}: ${res.status} ${await res.text()}`);
  }
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const lang = form.get("lang") === "nl" ? "nl" : "en";
  const bot = String(form.get("company") || "") !== "";
  const valid = email.length <= 254 && EMAIL.test(email);

  let ok = valid;
  if (valid && !bot) {
    try {
      await subscribe(email, lang);
    } catch (e) {
      console.error(e.message);
      ok = false;
    }
  }

  if ((req.headers.get("accept") || "").includes("application/json")) {
    return Response.json({ ok }, { status: ok ? 200 : valid ? 502 : 400 });
  }
  let back = "/apps/mandarinhero/blog/";
  try {
    const ref = new URL(req.headers.get("referer"));
    if (ref.host === new URL(req.url).host) back = ref.pathname;
  } catch {}
  return Response.redirect(new URL(`${back}#${ok ? "subscribed" : "subscribe-error"}`, req.url), 303);
};
