// Maile po zgłoszeniu „Chcę tę rybę”, wysyłane przez Resend (resend.com):
// 1) powiadomienie do sklepu (Marcin), 2) potwierdzenie dla klienta, jeśli podał e-mail.
// Bez RESEND_API_KEY nic nie wysyłamy; zgłoszenie i tak jest w panelu /admin/zapytania.
// Błąd wysyłki nigdy nie psuje zgłoszenia klienta: wołający łapie go i zapisuje w logach Vercela.
import "server-only";
import type { Contact } from "./enquiry";
import { formatPLN, plural, type Offer } from "./offers";
import { CONTACT } from "./contact";
import { SITE_NAME } from "./site";
import { abs, button, C, esc, eyebrow, facts, fishCard, layout, p, quote } from "./email/layout";

/** Resend przyjmuje najwyżej 40 MB na wiadomość; stopklatki mają po ~200 KB, więc to tylko bezpiecznik. */
const MAX_ATTACH_BYTES = 15 * 1024 * 1024;
/** Nadawca testowy Resend: działa bez własnej domeny, ale dostarcza tylko na adres właściciela konta. */
const TEST_FROM = `${SITE_NAME} <onboarding@resend.dev>`;

export type NotifyItem = { id: number; offer: Offer; qty: number; second: string; fishNo?: number | null; screenshots: { mime: string; data: Buffer }[] };
type Attachment = { filename: string; content: string; content_id: string };

const ryb = (n: number) => plural(n, "ryba", "ryby", "ryb");
const sender = () => process.env.EMAIL_FROM || TEST_FROM;

/** Czy możemy pisać do klientów: tylko z własnej, zweryfikowanej w Resend domeny (EMAIL_FROM). */
export function canEmailCustomers() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes("resend.dev"));
}

async function send(payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 500)}`);
}

/** Stopklatki jako załączniki „inline” (cid:), żeby pokazały się w treści maila bez publicznego adresu. */
function inlineShots(items: NotifyItem[]) {
  let size = 0;
  let n = 0;
  const attachments: Attachment[] = [];
  const cids = items.map((it, i) => {
    const out: string[] = [];
    for (const s of it.screenshots) {
      if ((size += s.data.length) > MAX_ATTACH_BYTES) break;
      const ext = s.mime === "image/png" ? "png" : s.mime === "image/webp" ? "webp" : "jpg";
      const cid = `shot${++n}`;
      attachments.push({ filename: `ryba-${i + 1}${it.screenshots.length > 1 ? `-${out.length + 1}` : ""}.${ext}`, content: s.data.toString("base64"), content_id: cid });
      out.push(`cid:${cid}`);
    }
    return out;
  });
  return { attachments, cids };
}

function summary(items: NotifyItem[]) {
  const fish = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + (i.offer.price ?? 0) * i.qty, 0);
  const unpriced = items.some((i) => !i.offer.price);
  const many = new Set(items.map((i) => i.offer.id)).size > 1;
  const title = items.length > 1 ? `${fish} ${ryb(fish)} z ${many ? "kilku ofert" : items[0].offer.title}` : items[0].offer.title;
  const totalText = total ? `ok. ${formatPLN(total)}${unpriced ? " + ryby z ceną do ustalenia" : ""}` : "cena do ustalenia";
  return { fish, total, totalText, title };
}

const itemLine = (it: NotifyItem) =>
  [it.fishNo ? `ryba nr ${it.fishNo} z mapy` : `${it.qty} szt.`, it.offer.price ? `${formatPLN(it.offer.price)} za sztukę` : "cena do ustalenia", it.second && `widać ją w ${it.second}`].filter(Boolean).join(" · ");

function fishList(items: NotifyItem[], cids: string[][]) {
  return items
    .map((it, i) => fishCard({ n: items.length > 1 ? i + 1 : undefined, title: it.offer.title, href: abs(`/oferta/${it.offer.id}`), line: itemLine(it), images: cids[i] }))
    .join("");
}

/** Powiadomienie do sklepu o nowym zgłoszeniu. */
export async function notifyNewEnquiry(e: Contact, items: NotifyItem[]) {
  const ids = items.map((i) => i.id);
  if (!process.env.RESEND_API_KEY) {
    console.warn("zgłoszenie: brak RESEND_API_KEY, e-mail do sklepu nie wysłany", { ids });
    return;
  }
  const to = (process.env.ENQUIRY_EMAIL_TO || CONTACT.email).split(",").map((s) => s.trim()).filter(Boolean);
  const panel = abs(`/admin/zapytania#z${ids[0]}`);
  const { fish, total, totalText, title } = summary(items);
  const { attachments, cids } = inlineShots(items);

  const telHref = `tel:${e.phone.replace(/[^\d+]/g, "")}`;
  const contact: [string, string][] = [
    ["Imię", esc(e.name)],
    ...(e.phone ? [["Telefon", `<a href="${telHref}" style="color:${C.hi};text-decoration:none">${esc(e.phone)}</a>`] as [string, string]] : []),
    ...(e.email ? [["E-mail", `<a href="mailto:${esc(e.email)}" style="color:${C.hi};text-decoration:none">${esc(e.email)}</a>`] as [string, string]] : []),
    ...(items.length > 1 || total ? [["Razem", esc(`${fish} ${ryb(fish)}, ${totalText}`)] as [string, string]] : []),
  ];

  const body = [
    p(`<b>${esc(e.name)}</b> chce ${esc(`${fish} ${ryb(fish)}`)}. Ryby z tego zgłoszenia są już oznaczone pod filmikiem jako <b>zarezerwowane</b>.`),
    button(panel, "Otwórz zgłoszenie w panelu"),
    eyebrow("Klient"),
    facts(contact),
    e.message ? eyebrow("Wiadomość") + quote(e.message) : "",
    eyebrow(items.length > 1 ? `Ryby (${items.length})` : "Ryba"),
    fishList(items, cids),
    e.phone || e.email
      ? p(
          `Szybka odpowiedź: ${[e.phone && `<a href="${telHref}" style="color:${C.hi}">zadzwoń</a>`, e.email && `kliknij „Odpowiedz”, a mail pójdzie prosto do klienta`].filter(Boolean).join(" albo ")}.`,
          `font-size:14px;color:${C.muted};margin-top:8px`,
        )
      : "",
  ].join("");

  const html = layout({ preheader: `${e.name}${e.phone ? `, ${e.phone}` : ""}: ${title}`, eyebrow: "Nowe zgłoszenie", title, body, footerNote: "Powiadomienie ze strony sklepu. Wszystkie zgłoszenia są w panelu /admin." });

  const text = [
    `Nowe zgłoszenie: ${title}`,
    "",
    `Imię: ${e.name}`,
    e.phone ? `Telefon: ${e.phone}` : null,
    e.email ? `E-mail: ${e.email}` : null,
    `Razem: ${fish} ${ryb(fish)}, ${totalText}`,
    ...(e.message ? ["", "Wiadomość:", e.message] : []),
    "",
    ...items.map((it, i) => `${i + 1}. ${it.offer.title} (${itemLine(it)}) ${abs(`/oferta/${it.offer.id}`)}`),
    "",
    `Panel: ${panel}`,
  ]
    .filter((l): l is string => typeof l === "string")
    .join("\n");

  await send({
    from: sender(),
    to,
    subject: `Nowe zgłoszenie: ${items.length > 1 ? `${fish} ${ryb(fish)}` : items[0].offer.title} – ${e.name}`,
    html,
    text,
    ...(e.email ? { reply_to: e.email } : {}),
    attachments,
  });
}

/**
 * Potwierdzenie dla klienta, że zgłoszenie dotarło. Wysyłamy tylko z własnej domeny (EMAIL_FROM),
 * bo testowy nadawca Resend nie dostarcza do obcych skrzynek.
 */
export async function confirmEnquiry(e: Contact, items: NotifyItem[]) {
  if (!e.email) return;
  if (!canEmailCustomers()) {
    console.warn("zgłoszenie: potwierdzenie dla klienta pominięte, ustaw EMAIL_FROM z własnej domeny w Resend");
    return;
  }
  const { fish, totalText, title } = summary(items);
  const { attachments, cids } = inlineShots(items);
  const first = e.name.split(/\s+/)[0];

  const steps = [
    ["Oddzwonimy albo odpiszemy", `${CONTACT.person} potwierdzi z Tobą rybę, cenę i termin odbioru.`],
    ["Płatność", "Przelewem albo gotówką przy odbiorze. Na stronie niczego nie płacisz."],
    ["Odbiór osobisty", `${CONTACT.street}, ${CONTACT.city}. Rybę pakujemy na miejscu.`],
  ];
  const stepsHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps
    .map(
      ([h, t], i) => `<tr><td style="vertical-align:top;padding:0 12px 14px 0;width:30px">
<div style="width:28px;height:28px;line-height:28px;border-radius:50%;background:${C.ink};color:${C.sand};text-align:center;font-family:Georgia,serif;font-size:14px">${i + 1}</div></td>
<td style="vertical-align:top;padding:3px 0 14px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:${C.text}"><b>${esc(h)}</b><br><span style="color:${C.muted}">${esc(t)}</span></td></tr>`,
    )
    .join("")}</table>`;

  const body = [
    p(`Cześć ${esc(first)}, dziękujemy! Twoje zgłoszenie dotarło do nas. ${fish > 1 ? "Ryby zaznaczyliśmy pod filmikiem jako zarezerwowane, żeby nikt inny ich nie zgłosił." : "Rybę zaznaczyliśmy pod filmikiem jako zarezerwowaną, żeby nikt inny jej nie zgłosił."}`),
    eyebrow(items.length > 1 ? `Twoje ryby (${fish})` : "Twoja ryba"),
    fishList(items, cids),
    items.length > 1 ? p(`Razem: <b>${esc(totalText)}</b>`, "margin-top:4px") : "",
    eyebrow("Co dalej"),
    stepsHtml,
    e.message ? eyebrow("Twoja wiadomość") + quote(e.message) : "",
    p(`Chcesz coś zmienić albo dopytać? Odpowiedz na tego maila albo zadzwoń: <a href="${CONTACT.phoneHref}" style="color:${C.hi};font-weight:700;text-decoration:none">${esc(CONTACT.phone)}</a>.`, "margin-top:22px"),
    button(abs("/katalog"), "Zobacz inne koi"),
  ].join("");

  const html = layout({
    preheader: `Dostaliśmy Twoje zgłoszenie: ${title}. ${CONTACT.person} wkrótce się odezwie.`,
    eyebrow: "Potwierdzenie zgłoszenia",
    title: "Dziękujemy, mamy Twoje zgłoszenie",
    body,
    footerNote: "Dostajesz tę wiadomość, bo wysłałeś(-aś) zgłoszenie na naszej stronie. To nie jest zamówienie ani faktura.",
  });

  const text = [
    `Cześć ${first}, dziękujemy! Twoje zgłoszenie dotarło do ${SITE_NAME}.`,
    "",
    ...items.map((it, i) => `${i + 1}. ${it.offer.title} (${itemLine(it)})`),
    ...(items.length > 1 ? [`Razem: ${totalText}`] : []),
    "",
    "Co dalej:",
    ...steps.map(([h, t], i) => `${i + 1}. ${h}: ${t}`),
    "",
    `Pytania: odpowiedz na tego maila albo zadzwoń ${CONTACT.phone}.`,
  ].join("\n");

  await send({
    from: sender(),
    to: [e.email],
    subject: `Dostaliśmy Twoje zgłoszenie: ${title}`,
    html,
    text,
    reply_to: CONTACT.email,
    attachments,
  });
}
