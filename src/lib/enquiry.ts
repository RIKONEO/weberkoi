// Walidacja zgłoszenia z koszyka. Klient zbiera ryby z jednego albo kilku filmików, na każdej
// stopklatce zaznacza rybę kółkiem i wysyła wszystko naraz. Cenę, płatność (przelew albo gotówka)
// i odbiór osobisty ustalamy z nim sami.
import { available, plural, type Offer } from "./offers";

/** Najwięcej ryb w jednym koszyku: tyle stopklatek mieści się w jednym wysłaniu z telefonu. */
export const MAX_ITEMS = 10;
/** Najwięcej zdjęć przy jednej rybie (stare formularze wysyłały do 3 screenshotów). */
export const MAX_SHOTS_PER_ITEM = 3;
/** Limit na plik po stronie serwera; przeglądarka i tak zmniejsza zdjęcia przed wysłaniem. */
export const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
/**
 * Vercel przyjmuje najwyżej ok. 4,5 MB w jednym zapytaniu. Gdy stopklatki z koszyka razem są
 * większe, przeglądarka zmniejsza je mocniej przed wysłaniem.
 */
export const MAX_UPLOAD_BYTES = 3.8 * 1024 * 1024;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Dane klienta wspólne dla wszystkich ryb ze zgłoszenia. */
export type Contact = { name: string; email: string; phone: string; message: string };
/** Jedna ryba ze zgłoszenia. */
export type EnquiryItem = { offerId: string; qty: number; second: string };
/** Jeden wiersz w bazie: ryba z danymi klienta. */
export type Enquiry = EnquiryItem & Contact;

export type ParsedItem = EnquiryItem & { offer: Offer; files: File[] };

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function images(v: FormDataEntryValue[]): File[] {
  return v.filter((x): x is File => typeof x === "object" && x.size > 0);
}

/**
 * Odczytuje pozycje koszyka: pole `items` (JSON z offerId, qty, second) i pliki `shot-0`, `shot-1`…
 * Starszy formularz z jedną rybą (offerId, qty, second, screenshot) też przechodzi, np. z karty
 * otwartej przed aktualizacją strony.
 */
function rawItems(f: FormData): { offerId: string; qty: number; second: string; files: File[] }[] | null {
  const json = f.get("items");
  if (typeof json !== "string") {
    return [{ offerId: str(f.get("offerId")), qty: Number(f.get("qty") ?? 1), second: str(f.get("second"), 10), files: images(f.getAll("screenshot")) }];
  }
  let list: unknown;
  try {
    list = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(list)) return null;
  return list.map((it, i) => {
    const o = (it ?? {}) as Record<string, unknown>;
    return { offerId: str(o.offerId), qty: Number(o.qty ?? 1), second: str(o.second, 10), files: images(f.getAll(`shot-${i}`)) };
  });
}

export function parseContact(f: FormData): Result<Contact> {
  const name = str(f.get("name"), 80);
  const email = str(f.get("email"), 120);
  const phone = str(f.get("phone"), 30);
  if (!name) return { ok: false, error: "Podaj imię." };
  if (!phone && !email) return { ok: false, error: "Podaj telefon albo e-mail, żebyśmy mogli odpisać." };
  if (phone && phone.replace(/\D/g, "").length < 9) return { ok: false, error: "Podaj pełny numer telefonu." };
  if (email && !EMAIL.test(email)) return { ok: false, error: "Podaj poprawny adres e-mail." };
  return { ok: true, value: { name, email, phone, message: str(f.get("message"), 1000) } };
}

/** `getOffer` podaje ofertę po id (tylko widoczne w sklepie). */
export async function parseBasket(
  f: FormData,
  getOffer: (id: string) => Promise<Offer | undefined>,
): Promise<Result<{ contact: Contact; items: ParsedItem[] }>> {
  const raw = rawItems(f);
  if (!raw) return { ok: false, error: "Nieprawidłowe zgłoszenie." };
  if (!raw.length) return { ok: false, error: "Koszyk jest pusty. Dodaj rybę ze stopklatką z filmiku." };
  if (raw.length > MAX_ITEMS) return { ok: false, error: `W jednym zgłoszeniu może być najwyżej ${MAX_ITEMS} ryb.` };

  const offers = new Map<string, Offer | undefined>();
  const items: ParsedItem[] = [];
  const perOffer = new Map<string, number>();
  for (const [i, it] of raw.entries()) {
    // Przy kilku rybach mówimy, której dotyczy błąd; przy jednej zaczynamy zdanie wielką literą.
    const label = raw.length > 1 ? `Ryba ${i + 1}: ` : "";
    const err = (t: string) => ({ ok: false as const, error: label ? label + t : t[0].toUpperCase() + t.slice(1) });
    if (!offers.has(it.offerId)) offers.set(it.offerId, it.offerId ? await getOffer(it.offerId) : undefined);
    const offer = offers.get(it.offerId);
    if (!offer) return err(`tej oferty nie ma już w sklepie. Usuń rybę z koszyka i wyślij resztę.`);
    if (!it.files.length) return err(`dodaj stopklatkę albo screenshot z filmiku, na którym widać rybę.`);
    if (it.files.length > MAX_SHOTS_PER_ITEM) return err(`możesz dodać najwyżej ${MAX_SHOTS_PER_ITEM} zdjęcia.`);
    if (it.files.some((x) => !x.type.startsWith("image/"))) return err(`screenshot musi być obrazkiem (JPG, PNG lub podobny).`);
    if (it.files.some((x) => x.size > MAX_SCREENSHOT_BYTES)) return err(`zdjęcie jest za duże. Spróbuj zrobić je jeszcze raz.`);
    const left = available(offer);
    const sum = (perOffer.get(offer.id) ?? 0) + it.qty;
    if (!Number.isInteger(it.qty) || it.qty < 1) return err(`podaj, ile ryb chcesz.`);
    if (left === 0) return { ok: false, error: `„${offer.title}”: wszystkie ryby z tej grupy są już sprzedane. Usuń je z koszyka.` };
    if (sum > left) return { ok: false, error: `„${offer.title}”: zostało tylko ${left} ${plural(left, "ryba", "ryby", "ryb")}, a w koszyku jest ${sum}. Zmniejsz liczbę.` };
    perOffer.set(offer.id, sum);
    items.push({ offerId: offer.id, qty: it.qty, second: it.second, offer, files: it.files });
  }

  const contact = parseContact(f);
  if (!contact.ok) return contact;
  return { ok: true, value: { contact: contact.value, items } };
}
