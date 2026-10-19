// Zasady dostawy żywych ryb. Wysyłamy tylko pon–śr, żeby paczka nie czekała w sortowni
// przez weekend. Wysyłki (np. w upał) wstrzymuje się w panelu admina.

export type DeliveryMethod = "kurier" | "odbior";

export const DELIVERY: Record<DeliveryMethod, { label: string; note: string; price: number }> = {
  kurier: {
    label: "Kurier z wysyłką ryb",
    note: "Worek z tlenem i karton termiczny. Dostawa następnego dnia roboczego.",
    price: 89,
  },
  odbior: {
    label: "Odbiór osobisty",
    note: "ul. Przykładowa 12, Weberowo · pon–sob 10:00–18:00",
    price: 0,
  },
};

export const SHIPPING_WEEKDAYS = [1, 2, 3]; // pon, wt, śr
export const PICKUP_WEEKDAYS = [1, 2, 3, 4, 5, 6]; // pon–sob

/** Najbliższe `n` dni (od jutra) wypadających w podane dni tygodnia, jako YYYY-MM-DD. */
export function nextDays(weekdays: number[], n: number, from = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  while (out.length < n) {
    if (weekdays.includes(d.getDay())) out.push(isoDate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function formatDay(iso: string, long = false): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(
    "pl-PL",
    long ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" },
  );
}
