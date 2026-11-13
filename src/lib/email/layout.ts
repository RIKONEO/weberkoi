// Wspólna oprawa maili WEBER Nishikigoi: ciemny nagłówek z logo, jasna kartka z treścią, stopka z kontaktem.
// Maile to osobny świat: tylko tabele i style w atrybutach, bo Gmail i Outlook wycinają <style> i flex/grid.
import { CONTACT } from "../contact";
import { SITE_NAME, SITE_URL } from "../site";

export const C = {
  ink: "#0b1416",
  ink2: "#122023",
  paper: "#fbf7ee",
  sand: "#efe6d2",
  line: "#e4dccb",
  text: "#1d2a2c",
  muted: "#6b7672",
  hi: "#c8302c",
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const abs = (path: string) => new URL(path, SITE_URL).toString();

/** Duży czerwony przycisk, działający też w Outlooku (tabela zamiast samego <a>). */
export function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px"><tr><td bgcolor="${C.hi}" style="border-radius:999px">
<a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a>
</td></tr></table>`;
}

/** Nagłówek sekcji: mały, rozstrzelony, jak „eyebrow” na stronie. */
export const eyebrow = (s: string) =>
  `<div style="font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:${C.muted};margin:28px 0 10px">${esc(s)}</div>`;

/** Tabela „etykieta: wartość”, np. dane klienta. Wartości mogą być gotowym HTML (linki tel:/mailto:). */
export function facts(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">${rows
    .map(
      ([k, v]) => `<tr>
<td style="padding:9px 12px 9px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;color:${C.muted};white-space:nowrap;vertical-align:top;width:1%">${esc(k)}</td>
<td style="padding:9px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;color:${C.text};font-weight:600">${v}</td></tr>`,
    )
    .join("")}</table>`;
}

/** Karta ryby: zdjęcie (stopklatka) i opis obok siebie; na telefonie zdjęcie po prostu się zmniejsza. */
export function fishCard(o: { n?: number; title: string; href: string; line: string; images: string[] }) {
  const imgs = o.images
    .map((src) => `<img src="${src}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:10px;margin-top:12px;border:0">`)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;background:#ffffff;border:1px solid ${C.line};border-radius:12px">
<tr><td style="padding:16px 16px 16px 16px">
<div style="font-family:${SERIF};font-size:19px;line-height:1.3;color:${C.text}">${o.n ? `<span style="color:${C.hi}">${o.n}.</span> ` : ""}<a href="${o.href}" style="color:${C.text};text-decoration:none">${esc(o.title)}</a></div>
<div style="font-family:${SANS};font-size:14px;color:${C.muted};margin-top:4px">${esc(o.line)}</div>
${imgs}
</td></tr></table>`;
}

export const p = (html: string, extra = "") =>
  `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.text};${extra}">${html}</p>`;

export function quote(text: string) {
  return `<div style="margin:6px 0 0;padding:14px 16px;background:${C.sand};border-left:3px solid ${C.hi};border-radius:8px;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.text};white-space:pre-wrap">${esc(text)}</div>`;
}

/**
 * Cały mail. `preheader` to szary tekst widoczny w Gmailu obok tematu na liście wiadomości.
 */
export function layout(o: { preheader: string; eyebrow: string; title: string; body: string; footerNote?: string }) {
  const tel = CONTACT.phoneHref;
  return `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${C.sand}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(o.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.sand}" style="background:${C.sand}">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-radius:16px;overflow:hidden">
<tr><td bgcolor="${C.ink}" align="center" style="background:${C.ink};padding:28px 24px 22px">
<a href="${abs("/")}" style="text-decoration:none"><img src="${abs("/logo-320.jpg")}" width="96" height="96" alt="${esc(SITE_NAME)}" style="display:block;width:96px;height:96px;border-radius:50%;border:0;margin:0 auto"></a>
<div style="font-family:${SERIF};font-size:22px;letter-spacing:3px;color:${C.sand};margin-top:12px">WEBER</div>
<div style="font-family:${SANS};font-size:10px;letter-spacing:3px;color:#8a948f;margin-top:2px">NISHIKIGOI · KOI</div>
</td></tr>
<tr><td bgcolor="${C.hi}" style="background:${C.hi};height:4px;line-height:4px;font-size:0">&nbsp;</td></tr>
<tr><td bgcolor="${C.paper}" style="background:${C.paper};padding:30px 32px 28px">
<div style="font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:${C.hi}">${esc(o.eyebrow)}</div>
<h1 style="margin:8px 0 18px;font-family:${SERIF};font-weight:400;font-size:28px;line-height:1.25;color:${C.text}">${esc(o.title)}</h1>
${o.body}
</td></tr>
<tr><td bgcolor="${C.ink2}" style="background:${C.ink2};padding:22px 32px;font-family:${SANS};font-size:13px;line-height:1.7;color:#b8b4a6">
<div style="font-family:${SERIF};font-size:16px;color:${C.sand};margin-bottom:4px">${esc(SITE_NAME)}</div>
${esc(CONTACT.person)} · <a href="${tel}" style="color:${C.sand};text-decoration:none">${esc(CONTACT.phone)}</a> · <a href="mailto:${CONTACT.email}" style="color:${C.sand};text-decoration:none">${esc(CONTACT.email)}</a><br>
${esc(CONTACT.street)}, ${esc(CONTACT.city)} · odbiór osobisty<br>
<a href="${abs("/")}" style="color:${C.sand}">${esc(new URL(SITE_URL).host)}</a>${o.footerNote ? `<div style="margin-top:10px;color:#8a948f;font-size:12px">${o.footerNote}</div>` : ""}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
