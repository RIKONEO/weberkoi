import { NextResponse } from "next/server";
import sharp from "sharp";
import { createEnquiry, getOffer } from "@/lib/data";
import { parseEnquiry } from "@/lib/enquiry";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Nieprawidłowe zgłoszenie." }, { status: 400 });
  // Pole niewidoczne dla ludzi; wypełniają je tylko boty.
  if (String(form.get("website") ?? "")) return NextResponse.json({ ok: true });
  const offer = await getOffer(String(form.get("offerId") ?? ""));
  const parsed = parseEnquiry(form, offer);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  // Każdy plik przepuszczamy przez sharp: sprawdza, że to naprawdę obrazek, obraca według EXIF i zmniejsza.
  const screenshots: { mime: string; data: Buffer }[] = [];
  for (const file of parsed.value.files) {
    try {
      const data = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();
      screenshots.push({ mime: "image/jpeg", data });
    } catch {
      return NextResponse.json({ error: "Nie udało się odczytać screenshota. Spróbuj z innym plikiem." }, { status: 422 });
    }
  }

  await createEnquiry(parsed.value.enquiry, screenshots);
  // Następny krok: e-mail do sklepu o nowym zgłoszeniu.
  return NextResponse.json({ ok: true });
}
