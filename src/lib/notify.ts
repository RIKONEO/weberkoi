// E-mail do sklepu o nowym zgłoszeniu „Chcę tę rybę”, wysyłany przez Resend (resend.com).
// Bez RESEND_API_KEY nic nie wysyłamy; zgłoszenie i tak jest w panelu /admin/zapytania.
// Błąd wysyłki nigdy nie psuje zgłoszenia klienta: tylko trafia do logów Vercela.
import "server-only";
import type { Contact } from "./enquiry";
import { formatPLN, plural, type Offer } from "./offers";
import { CONTACT } from "./contact";
import { SITE_URL } from "./site";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Resend przyjmuje najwyżej 40 MB na wiadomość; stopklatki mają po ~200 KB, więc to tylko bezpiecznik. */
const MAX_ATTACH_BYTES = 15 * 1024 * 1024;

export type NotifyItem = { id: number; offer: Offer; qty: number; second: string; screenshots: { mime: string; data: Buffer }[] };

const ryb = (n: number) => plural(n, "ryba", "ryby", "ryb");

export async function notifyNewEnquiry(e: Contact, items: NotifyItem[]) {
  const key = process.env.RESEND_API_KEY;
  const ids = items.map((i) => i.id);
  if (!key) {
    console.warn("zgłoszenie: brak RESEND_API_KEY, e-mail do sklepu nie wysłany", { ids });
    return;
  }
  const to = (process.env.ENQUIRY_EMAIL_TO || CONTACT.email).split(",").map((s) => s.trim()).filter(Boolean);
  const from = process.env.EMAIL_FROM || "WEBER Koi <onboarding@resend.dev>";
  const panel = new URL(`/admin/zapytania#z${ids[0]}`, SITE_URL).toString();
  const fish = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + (i.offer.price ?? 0) * i.qty, 0);
  const unpriced = items.some((i) => !i.offer.price);

  const contact: [string, string][] = [
    ["Imię", e.name],
    ...(e.phone ? [["Telefon", e.phone] as [string, string]] : []),
    ...(e.email ? [["E-mail", e.email] as [string, string]] : []),
    ...(items.length > 1 || total
      ? [["Razem", `${fish} ${ryb(fish)}${total ? `, ok. ${formatPLN(total)}${unpriced ? " + ryby z ceną do ustalenia" : ""}` : ""}`] as [string, string]]
      : []),
  ];

  let size = 0;
  let n = 0;
  const attachments: { filename: string; content: string; content_id: string }[] = [];
  const blocks = items.map((it, i) => {
    const cids: string[] = [];
    for (const s of it.screenshots) {
      if ((size += s.data.length) > MAX_ATTACH_BYTES) break;
      const ext = s.mime === "image/png" ? "png" : s.mime === "image/webp" ? "webp" : "jpg";
      const cid = `shot${++n}`;
      attachments.push({ filename: `ryba-${i + 1}${it.screenshots.length > 1 ? `-${cids.length + 1}` : ""}.${ext}`, content: s.data.toString("base64"), content_id: cid });
      cids.push(cid);
    }
    const line = [`${it.qty} szt.`, it.offer.price ? `${formatPLN(it.offer.price)} za sztukę` : "cena do ustalenia", it.second && `widać ją w ${it.second}`].filter(Boolean).join(" · ");
    const url = new URL(`/oferta/${it.offer.id}`, SITE_URL).toString();
    return {
      html: `<div style="border-top:1px solid #ddd;padding-top:10px;margin-top:10px">
<p style="margin:0 0 6px"><b>${items.length > 1 ? `${i + 1}. ` : ""}<a href="${url}" style="color:#1a1a1a">${esc(it.offer.title)}</a></b><br><span style="color:#666">${esc(line)}</span></p>
${cids.map((c) => `<p style="margin:0 0 6px"><img src="cid:${c}" alt="" style="max-width:100%;border-radius:6px"></p>`).join("")}
</div>`,
      text: `${i + 1}. ${it.offer.title} (${line}) ${url}`,
    };
  });

  const title = items.length > 1 ? `${fish} ${ryb(fish)} z ${new Set(items.map((i) => i.offer.id)).size > 1 ? "kilku ofert" : items[0].offer.title}` : items[0].offer.title;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1a1a;max-width:600px">
<h2 style="margin:0 0 12px">Nowe zgłoszenie: ${esc(title)}</h2>
<table cellpadding="6" style="border-collapse:collapse">${contact
    .map(([k, v]) => `<tr><td style="color:#666">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`)
    .join("")}</table>
${e.message ? `<p style="white-space:pre-wrap;background:#f4f4f4;padding:10px;border-radius:6px">${esc(e.message)}</p>` : ""}
${blocks.map((b) => b.html).join("")}
<p><a href="${panel}" style="display:inline-block;background:#b3261e;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Otwórz zgłoszenie w panelu</a></p>
</div>`;

  const text = [
    `Nowe zgłoszenie: ${title}`,
    "",
    ...contact.map(([k, v]) => `${k}: ${v}`),
    ...(e.message ? ["", "Wiadomość:", e.message] : []),
    "",
    ...blocks.map((b) => b.text),
    "",
    `Panel: ${panel}`,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: `Nowe zgłoszenie: ${items.length > 1 ? `${fish} ${ryb(fish)}` : items[0].offer.title} – ${e.name}`,
      html,
      text,
      ...(e.email ? { reply_to: e.email } : {}),
      attachments,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 500)}`);
}
