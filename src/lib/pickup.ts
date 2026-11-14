// Termin odbioru zarezerwowanych ryb. Wspólne dla sklepu, maili i panelu.

/** Tyle dni klient ma na odbiór ryb od wysłania zgłoszenia. Potem ryby mogą wrócić do sprzedaży. */
export const PICKUP_DAYS = 14;
export const PICKUP_TEXT = "2 tygodnie";

/** Ostatni dzień odbioru dla zgłoszenia z danej chwili. */
export function pickupDeadline(from: Date = new Date()): Date {
  return new Date(from.getTime() + PICKUP_DAYS * 24 * 3600 * 1000);
}

/** Data po polsku, np. „28.11.2026” (strefa czasowa sklepu). */
export function formatDay(d: Date): string {
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Warsaw" });
}

/** Zdanie o terminie odbioru do pokazania klientowi przed wysłaniem zgłoszenia. */
export const PICKUP_RULE = `Rezerwacja trwa ${PICKUP_TEXT}: w tym czasie odbierz ryby osobiście w Zakrzewie. Po tym terminie ryby wracają do sprzedaży.`;
