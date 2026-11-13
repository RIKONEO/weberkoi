// E-mail do sklepu o nowym zgłoszeniu „Chcę tę rybę”, wysyłany przez Resend (resend.com).
// Bez RESEND_API_KEY nic nie wysyłamy; zgłoszenie i tak jest w panelu /admin/zapytania.
// Błąd wysyłki nigdy nie psuje zgłoszenia klienta: tylko trafia do logów Vercela.
import "server-only";
import type { Enquiry } from "./enquiry";
import type { Offer } from "./offers";
import { CONTACT } from "./contact";
import { SITE_URL } from "./site";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Resend przyjmuje najwyżej 40 MB na wiadomość; stopklatki mają po ~200 KB, więc to tylko bezpiecznik. */
const MAX_ATTACH_BYTES = 15 * 1024 * 1024;

export async function notifyNewEnquiry(id: number, e: Enquiry, offer: Offer, screenshots: { mime: string; data: Buffer }[]) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("zgłoszenie: brak RESEND_API_KEY, e-mail do sklepu nie wysłany", { id });
    return;
  }
  const to = (process.env.ENQUIRY_EMAIL_TO || CONTACT.email).split(",").map((s) => s.trim()).filter(Boolean);
  const from = process.env.EMAIL_FROM || "WEBER Koi <onboarding@resend.dev>";
  const panel = new URL(`/admin/zapytania#z${id}`, SITE_URL).toString();
  const offerUrl = new URL(`/oferta/${offer.id}`, SITE_URL).toString();

  const rows: [string, string][] = [
    ["Oferta", offer.title],
    ["Ile ryb", `${e.qty} szt.`],
    ...(e.second ? [["Moment filmiku", e.second] as [string, string]] : []),
    ["Imię", e.name],
    ...(e.phone ? [["Telefon", e.phone] as [string, string]] : []),
    ...(e.email ? [["E-mail", e.email] as [string, string]] : []),
  ];

  let size = 0;
  const attachments = screenshots
    .filter((s) => (size += s.data.length) <= MAX_ATTACH_BYTES)
    .map((s, i) => {
      const ext = s.mime === "image/png" ? "png" : s.mime === "image/webp" ? "webp" : "jpg";
      return { filename: `stopklatka-${i + 1}.${ext}`, content: s.data.toString("base64"), content_id: `shot${i + 1}` };
    });

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1a1a;max-width:600px">
<h2 style="margin:0 0 12px">Nowe zgłoszenie: ${esc(offer.title)}</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#666">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`)
    .join("")}</table>
${e.message ? `<p style="white-space:pre-wrap;background:#f4f4f4;padding:10px;border-radius:6px">${esc(e.message)}</p>` : ""}
${attachments.map((a) => `<p><img src="cid:${a.content_id}" alt="${a.filename}" style="max-width:100%;border-radius:6px"></p>`).join("")}
<p><a href="${panel}" style="display:inline-block;background:#b3261e;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Otwórz zgłoszenie w panelu</a></p>
<p style="color:#666;font-size:13px">Oferta na stronie: <a href="${offerUrl}">${esc(offerUrl)}</a></p>
</div>`;

  const text = [
    `Nowe zgłoszenie: ${offer.title}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ...(e.message ? ["", "Wiadomość:", e.message] : []),
    "",
    `Panel: ${panel}`,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: `Nowe zgłoszenie: ${offer.title} – ${e.name}`,
      html,
      text,
      ...(e.email ? { reply_to: e.email } : {}),
      attachments,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 500)}`);
}
