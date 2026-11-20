// Walidacja formularza oferty z panelu admina.
import type { OfferInput } from "./data";

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** „3, 8 14” → [3, 8, 14]; null, gdy coś nie jest liczbą. */
export function parseNumberList(s: string): number[] | null {
  const parts = s.split(/[\s,;]+/).filter(Boolean);
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isInteger(n) || n < 1)) return null;
  return [...new Set(nums)].sort((a, b) => a - b);
}

export function parseOfferForm(f: FormData, varieties: string[], existingId?: string): { ok: true; value: OfferInput } | { ok: false; error: string } {
  const get = (k: string) => String(f.get(k) ?? "").trim();
  const int = (k: string) => (get(k) === "" ? NaN : Number(get(k)));

  const title = get("title");
  if (!title) return { ok: false, error: "Podaj tytuł oferty." };
  const id = existingId ?? (slugify(get("id") || title) || "");
  if (!id) return { ok: false, error: "Podaj adres oferty (same litery, cyfry i myślniki)." };
  const variety = get("variety");
  if (!varieties.includes(variety)) return { ok: false, error: "Wybierz odmianę z listy." };

  const sizeMin = int("sizeMin"), sizeMax = int("sizeMax"), count = int("count");
  if (!Number.isInteger(sizeMin) || !Number.isInteger(sizeMax) || sizeMin < 1 || sizeMax < sizeMin) return { ok: false, error: "Podaj rozmiar od–do w cm (np. 15 i 20)." };
  if (!Number.isInteger(count) || count < 1 || count > 500) return { ok: false, error: "Podaj, ile ryb jest na filmiku." };

  const priceRaw = get("price");
  const price = priceRaw === "" ? null : Number(priceRaw.replace(",", "."));
  if (price !== null && (!Number.isInteger(price) || price < 1)) return { ok: false, error: "Cena to pełne złote (np. 290). Zostaw puste dla „zapytaj o cenę”." };

  const sold = parseNumberList(get("sold"));
  if (!sold) return { ok: false, error: "Numery sprzedanych ryb wpisz po przecinku, np. 3, 8, 14." };
  if (sold.some((n) => n > count)) return { ok: false, error: `Numer sprzedanej ryby nie może być większy niż ${count}.` };
  const groupSold = get("groupSold") === "" ? 0 : int("groupSold");
  if (!Number.isInteger(groupSold) || groupSold < 0) return { ok: false, error: "Liczba sprzedanych z grupy musi być liczbą całkowitą." };
  if (sold.length + groupSold > count) return { ok: false, error: "Sprzedanych ryb jest więcej niż ryb w grupie." };

  const url = (k: string) => {
    const v = get(k);
    return v ? v : null;
  };
  for (const k of ["videoUrl", "posterUrl"]) {
    const v = get(k);
    if (v && !/^https:\/\//.test(v)) return { ok: false, error: "Adres filmiku i miniatury musi zaczynać się od https://." };
  }

  return {
    ok: true,
    value: {
      id,
      variety,
      title,
      breeder: get("breeder"),
      age: get("age"),
      sizeMin,
      sizeMax,
      count,
      price,
      sold,
      groupSold,
      videoUrl: url("videoUrl"),
      posterUrl: url("posterUrl"),
      videoLength: url("videoLength"),
      description: get("description"),
      published: f.get("published") === "on",
      featured: f.get("featured") === "on",
    },
  };
}

/** Nazwa odmiany: bez zbędnych spacji, każde słowo z wielkiej litery („shiro utsuri” → „Shiro Utsuri”). */
export function parseVarietyName(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name) return { ok: false, error: "Wpisz nazwę odmiany." };
  if (name.length > 40) return { ok: false, error: "Nazwa odmiany może mieć najwyżej 40 znaków." };
  return { ok: true, value: name.replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("pl-PL")) };
}

/** Najwięcej zdjęć przy jednym obrazie. */
export const MAX_ART_PHOTOS = 8;

/** Adres zdjęcia obrazu: wgrane w panelu (/zdjecie/12) albo plik ze strony (/img/…). */
const PHOTO_URL = /^\/(zdjecie\/\d+|img\/[\w./-]+\.(jpe?g|png|webp))$/;

/** Formularz obrazu z metalu (dział Koi Light Art) z panelu admina. */
export function parseArtworkForm(f: FormData, existingId?: string): { ok: true; value: OfferInput } | { ok: false; error: string } {
  const get = (k: string) => String(f.get(k) ?? "").trim();
  const title = get("title");
  if (!title) return { ok: false, error: "Podaj nazwę obrazu." };
  const id = existingId ?? (slugify(get("id") || `obraz-${title}`) || "");
  if (!id) return { ok: false, error: "Podaj adres obrazu (same litery, cyfry i myślniki)." };

  const priceRaw = get("price");
  const price = priceRaw === "" ? null : Number(priceRaw.replace(/\s/g, "").replace(",", "."));
  if (price !== null && (!Number.isInteger(price) || price < 1)) return { ok: false, error: "Cena to pełne złote (np. 890). Zostaw puste dla „cena na zapytanie”." };

  const count = get("count") === "" ? NaN : Number(get("count"));
  if (!Number.isInteger(count) || count < 0 || count > 999) return { ok: false, error: "Podaj, ile sztuk możesz sprzedać (np. 1, a 0 = wyprzedany)." };
  const groupSold = get("groupSold") === "" ? 0 : Number(get("groupSold"));
  if (!Number.isInteger(groupSold) || groupSold < 0) return { ok: false, error: "Liczba sprzedanych musi być liczbą całkowitą." };

  let photos: string[];
  try {
    const raw = JSON.parse(get("photos") || "[]");
    photos = Array.isArray(raw) ? raw.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return { ok: false, error: "Nie udało się odczytać listy zdjęć. Odśwież stronę i spróbuj jeszcze raz." };
  }
  photos = [...new Set(photos)];
  if (photos.some((p) => !PHOTO_URL.test(p))) return { ok: false, error: "Nieprawidłowe zdjęcie na liście. Usuń je i wgraj jeszcze raz." };
  if (photos.length > MAX_ART_PHOTOS) return { ok: false, error: `Obraz może mieć najwyżej ${MAX_ART_PHOTOS} zdjęć.` };

  return {
    ok: true,
    value: {
      id,
      kind: "obraz",
      variety: "",
      title: title.slice(0, 120),
      breeder: "",
      age: "",
      sizeMin: 0,
      sizeMax: 0,
      // Sztuk do sprzedania; sprzedane ze zgłoszeń („Sprzedana” w panelu) zwiększają groupSold.
      count: Math.max(count, groupSold),
      price,
      sold: [],
      groupSold,
      videoUrl: null,
      posterUrl: null,
      videoLength: null,
      dimensions: get("dimensions").slice(0, 80),
      photos,
      description: get("description").slice(0, 3000),
      published: f.get("published") === "on",
      featured: f.get("featured") === "on",
    },
  };
}
