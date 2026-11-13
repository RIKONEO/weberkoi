// Obrazki podglądu linków (Facebook, Instagram, Messenger, WhatsApp). Rysowane przez next/og
// z naszymi fontami, bo domyślny font nie ma polskich liter.
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const asset = (name: string) => readFile(join(process.cwd(), "src/assets/og", name));

async function fonts() {
  const [m5, m5e, m7, m7e, t, te] = await Promise.all([
    asset("manrope-latin-500-normal.woff"),
    asset("manrope-latin-ext-500-normal.woff"),
    asset("manrope-latin-700-normal.woff"),
    asset("manrope-latin-ext-700-normal.woff"),
    asset("marcellus-latin-400-normal.woff"),
    asset("marcellus-latin-ext-400-normal.woff"),
  ]);
  return [
    { name: "Manrope", data: m5, weight: 500 as const },
    { name: "Manrope", data: m5e, weight: 500 as const },
    { name: "Manrope", data: m7, weight: 700 as const },
    { name: "Manrope", data: m7e, weight: 700 as const },
    { name: "Marcellus", data: t, weight: 400 as const },
    { name: "Marcellus", data: te, weight: 400 as const },
  ];
}

const dataUrl = (buf: Buffer, mime: string) => `data:${mime};base64,${buf.toString("base64")}`;

/** Miniatura filmiku z Bunny jako data URL. Gdy się nie uda (blokada, timeout), rysujemy obrazek bez zdjęcia. */
export async function fetchPhoto(url: string | undefined): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const site = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const res = await fetch(url, {
      headers: site ? { Referer: `https://${site}/` } : {},
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(jpeg|png)/.test(type)) return undefined;
    return dataUrl(Buffer.from(await res.arrayBuffer()), type.split(";")[0]);
  } catch {
    return undefined;
  }
}

const C = { ink: "#0b1416", ink2: "#122023", paper: "#efe6d2", paper2: "#b8b4a6", hi: "#c8302c", line: "#26393c" };

export type OgCard = {
  eyebrow: string;
  title: string;
  lines: string[];
  price?: string;
  photo?: string;
};

export async function renderOg(card: OgCard) {
  const logo = dataUrl(await asset("logo.jpg"), "image/jpeg");
  const textWidth = card.photo ? 560 : 1040;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: C.ink, color: C.paper, fontFamily: "Manrope" }}>
        {card.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.photo} alt="" width={560} height={630} style={{ width: 560, height: 630, objectFit: "cover" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 60px", width: textWidth + 120, flexGrow: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" width={72} height={72} style={{ borderRadius: 36 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "Marcellus", fontSize: 34, letterSpacing: 2 }}>WEBER</span>
              <span style={{ fontSize: 16, letterSpacing: 6, color: C.paper2 }}>NISHIKIGOI</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: C.hi }}>{card.eyebrow}</span>
            <span style={{ fontFamily: "Marcellus", fontSize: card.title.length > 28 ? 52 : 64, lineHeight: 1.05 }}>{card.title}</span>
            {card.lines.map((l) => (
              <span key={l} style={{ fontSize: 28, color: C.paper2 }}>{l}</span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `2px solid ${C.line}`, paddingTop: 22 }}>
            <span style={{ fontSize: 24, color: C.paper2 }}>Odbiór osobisty · Zakrzewo</span>
            {card.price && (
              <span style={{ fontSize: 34, fontWeight: 700, background: C.hi, color: "#fff6ee", padding: "8px 22px", borderRadius: 999 }}>{card.price}</span>
            )}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
