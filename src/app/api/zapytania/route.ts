import { NextResponse } from "next/server";
import sharp from "sharp";
import { createEnquiry, getOffer } from "@/lib/data";
import { parseEnquiry } from "@/lib/enquiry";
import { CONTACT } from "@/lib/contact";

const SERVER_ERROR = `Coś poszło nie tak po naszej stronie. Spróbuj jeszcze raz za chwilę albo zadzwoń: ${CONTACT.phone}.`;

/** JPEG, PNG albo WebP po pierwszych bajtach; przeglądarka i tak wysyła JPEG ze stopklatki. */
function looksLikeImage(b: Buffer) {
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b.subarray(0, 4).toString("hex") === "89504e47";
  const webp = b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
  return jpeg || png || webp;
}

/**
 * Przepuszcza obrazek przez sharp: sprawdza, że to naprawdę obrazek, obraca według EXIF i zmniejsza.
 * Gdyby sharp zawiódł, a plik to zwykły JPEG/PNG/WebP (stopklatka z przeglądarki jest już zmniejszona),
 * bierzemy go bez zmian, żeby zgłoszenie klienta nie przepadło.
 */
async function normalize(file: File): Promise<{ mime: string; data: Buffer } | null> {
  const input = Buffer.from(await file.arrayBuffer());
  try {
    const data = await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    return { mime: "image/jpeg", data };
  } catch (err) {
    console.error("zgłoszenie: sharp nie przetworzył screenshota", { type: file.type, size: file.size, err });
    return looksLikeImage(input) ? { mime: file.type || "image/jpeg", data: input } : null;
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Nieprawidłowe zgłoszenie." }, { status: 400 });
    // Pole niewidoczne dla ludzi; wypełniają je tylko boty.
    if (String(form.get("website") ?? "")) return NextResponse.json({ ok: true });
    const offer = await getOffer(String(form.get("offerId") ?? ""));
    const parsed = parseEnquiry(form, offer);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

    const screenshots: { mime: string; data: Buffer }[] = [];
    for (const file of parsed.value.files) {
      const shot = await normalize(file);
      if (!shot) return NextResponse.json({ error: "Nie udało się odczytać screenshota. Spróbuj z innym plikiem." }, { status: 422 });
      screenshots.push(shot);
    }

    await createEnquiry(parsed.value.enquiry, screenshots);
    // Następny krok: e-mail do sklepu o nowym zgłoszeniu.
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Trafia do logów Vercela (Logs, ścieżka /api/zapytania).
    console.error("zgłoszenie: błąd zapisu", err);
    return NextResponse.json({ error: SERVER_ERROR }, { status: 500 });
  }
}
