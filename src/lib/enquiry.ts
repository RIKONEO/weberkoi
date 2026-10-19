// Walidacja zgłoszenia ze screenshotem z filmiku. Klient pokazuje nam rybę na zrzucie ekranu,
// a cenę, płatność (przelew albo gotówka) i dostawę ustalamy z nim sami.
import type { Offer } from "./offers";

export const MAX_SCREENSHOTS = 3;
/** Limit na plik po stronie serwera; przeglądarka i tak zmniejsza zdjęcia przed wysłaniem. */
export const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type Enquiry = { offerId: string; qty: number; second: string; name: string; email: string; phone: string; message: string };

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function parseEnquiry(f: FormData, offer: Offer | undefined): Result<{ enquiry: Enquiry; files: File[] }> {
  if (!offer) return { ok: false, error: "Nie znaleziono oferty." };
  const files = f.getAll("screenshot").filter((v): v is File => typeof v === "object" && v.size > 0);
  if (!files.length) return { ok: false, error: "Dodaj screenshot z filmiku, na którym widać rybę." };
  if (files.length > MAX_SCREENSHOTS) return { ok: false, error: `Możesz dodać najwyżej ${MAX_SCREENSHOTS} screenshoty.` };
  if (files.some((x) => !x.type.startsWith("image/"))) return { ok: false, error: "Screenshot musi być obrazkiem (JPG, PNG lub podobny)." };
  if (files.some((x) => x.size > MAX_SCREENSHOT_BYTES)) return { ok: false, error: "Jeden ze screenshotów jest za duży. Spróbuj zrobić go jeszcze raz." };

  const name = str(f.get("name"), 80);
  const email = str(f.get("email"), 120);
  const phone = str(f.get("phone"), 30);
  if (!name) return { ok: false, error: "Podaj imię." };
  if (!phone && !email) return { ok: false, error: "Podaj telefon albo e-mail, żebyśmy mogli odpisać." };
  if (phone && phone.replace(/\D/g, "").length < 9) return { ok: false, error: "Podaj pełny numer telefonu." };
  if (email && !EMAIL.test(email)) return { ok: false, error: "Podaj poprawny adres e-mail." };

  const qty = Number(f.get("qty") ?? 1);
  if (!Number.isInteger(qty) || qty < 1 || qty > offer.count) return { ok: false, error: "Podaj, ile ryb chcesz." };

  return {
    ok: true,
    value: { enquiry: { offerId: offer.id, qty, second: str(f.get("second"), 10), name, email, phone, message: str(f.get("message"), 1000) }, files },
  };
}
