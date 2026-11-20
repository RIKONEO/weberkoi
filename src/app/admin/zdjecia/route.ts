import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { addOfferPhoto } from "@/lib/data";
import { normalizeImage } from "@/lib/image";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * Wgrywanie zdjęcia obrazu z panelu. Przeglądarka zmniejsza zdjęcie przed wysłaniem, a serwer
 * jeszcze raz przepuszcza je przez sharp. Zwraca adres, który formularz dopisuje do listy zdjęć.
 */
export async function POST(req: Request) {
  const jar = await cookies();
  if (!(await verifySessionToken(jar.get(SESSION_COOKIE)?.value))) return fail("Zaloguj się ponownie do panelu.", 401);
  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  if (!file || typeof file !== "object" || !file.size) return fail("Wybierz zdjęcie.");
  if (file.size > 8 * 1024 * 1024) return fail("Zdjęcie jest za duże (najwyżej 8 MB).");
  const img = await normalizeImage(file, 2000, "zdjęcie obrazu");
  if (!img) return fail("Nie udało się odczytać zdjęcia. Spróbuj z innym plikiem (JPG, PNG).");
  const offerId = String(form?.get("offerId") ?? "") || undefined;
  const url = await addOfferPhoto(img, offerId);
  return NextResponse.json({ ok: true, url });
}
