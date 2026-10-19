// Walidacja zamówień i zapytań po stronie serwera. Ceny zawsze liczymy tutaj z danych
// oferty, nigdy nie ufamy kwotom przysłanym z przeglądarki.
import { type Offer, available } from "./offers";
import { DELIVERY, type DeliveryMethod, PICKUP_WEEKDAYS, SHIPPING_WEEKDAYS, isoDate } from "./shipping";

export type PaymentMethod = "online" | "przy-odbiorze";
export const PAYMENTS: Record<PaymentMethod, { label: string; note: string }> = {
  online: { label: "Płatność online", note: "BLIK, karta lub Przelewy24 na bezpiecznej stronie Stripe" },
  "przy-odbiorze": { label: "Przy odbiorze", note: "Gotówka lub karta na miejscu" },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function checkSelection(offer: Offer, qty: unknown, picks: unknown): Result<{ qty: number; picks: number[] | null }> {
  if (Array.isArray(picks)) {
    const nums = [...new Set(picks)].filter((p): p is number => Number.isInteger(p));
    if (!nums.length || nums.length !== picks.length) return { ok: false, error: "Wybierz numery ryb z filmiku." };
    const bad = nums.find((p) => p < 1 || p > offer.count || offer.sold.includes(p));
    if (bad !== undefined) return { ok: false, error: `Ryba nr ${bad} z oferty ${offer.variety} jest niedostępna.` };
    return { ok: true, value: { qty: nums.length, picks: nums.sort((a, b) => a - b) } };
  }
  if (!Number.isInteger(qty) || (qty as number) < 1) return { ok: false, error: "Podaj liczbę ryb." };
  if ((qty as number) > available(offer)) return { ok: false, error: `W grupie ${offer.variety} zostało tylko ${available(offer)} ryb.` };
  return { ok: true, value: { qty: qty as number, picks: null } };
}

export type Enquiry = { offerId: string; qty: number; picks: number[] | null; second: string; name: string; email: string; message: string };

export function parseEnquiry(body: Record<string, unknown>, findOffer: (id: string) => Offer | undefined): Result<Enquiry> {
  const offer = findOffer(str(body.offerId));
  if (!offer) return { ok: false, error: "Nie znaleziono oferty." };
  const sel = checkSelection(offer, body.qty, body.picks);
  if (!sel.ok) return sel;
  const name = str(body.name, 80), email = str(body.email, 120);
  if (!name) return { ok: false, error: "Podaj imię." };
  if (!EMAIL.test(email)) return { ok: false, error: "Podaj poprawny adres e-mail." };
  return { ok: true, value: { offerId: offer.id, ...sel.value, second: str(body.second, 10), name, email, message: str(body.message, 1000) } };
}

export type OrderLine = { offerId: string; title: string; qty: number; picks: number[] | null; unitPrice: number };
export type Order = {
  lines: OrderLine[];
  customer: { name: string; email: string; phone: string; street: string; city: string };
  delivery: DeliveryMethod;
  day: string;
  payment: PaymentMethod;
  itemsTotal: number;
  deliveryPrice: number;
  total: number;
};

type OrderContext = { findOffer: (id: string) => Offer | undefined; shippingPaused: boolean; today?: Date };

export function parseOrder(body: Record<string, unknown>, { findOffer, shippingPaused, today = new Date() }: OrderContext): Result<Order> {
  if (!Array.isArray(body.lines) || !body.lines.length) return { ok: false, error: "Koszyk jest pusty." };
  const lines: OrderLine[] = [];
  for (const raw of body.lines as Record<string, unknown>[]) {
    const offer = findOffer(str(raw?.offerId));
    if (!offer) return { ok: false, error: "Jedna z ofert w koszyku nie jest już dostępna." };
    if (!offer.price) return { ok: false, error: `Cenę ${offer.variety} ustalamy indywidualnie. Wyślij zapytanie z karty oferty.` };
    const sel = checkSelection(offer, raw.qty, raw.picks);
    if (!sel.ok) return sel;
    lines.push({ offerId: offer.id, title: offer.title, ...sel.value, unitPrice: offer.price });
  }
  // Kilka pozycji z tej samej oferty razem nie może przekroczyć dostępnych ryb ani powtórzyć numeru.
  for (const id of new Set(lines.map((l) => l.offerId))) {
    const offer = findOffer(id)!;
    const same = lines.filter((l) => l.offerId === id);
    const picks = same.flatMap((l) => l.picks ?? []);
    if (new Set(picks).size !== picks.length) return { ok: false, error: `Ta sama ryba z oferty ${offer.variety} jest w koszyku dwa razy.` };
    if (same.reduce((s, l) => s + l.qty, 0) > available(offer)) return { ok: false, error: `W grupie ${offer.variety} zostało tylko ${available(offer)} ryb.` };
  }

  const c = (body.customer ?? {}) as Record<string, unknown>;
  const customer = { name: str(c.name, 120), email: str(c.email, 120), phone: str(c.phone, 30), street: str(c.street, 160), city: str(c.city, 120) };
  if (!customer.name) return { ok: false, error: "Podaj imię i nazwisko." };
  if (!EMAIL.test(customer.email)) return { ok: false, error: "Podaj poprawny adres e-mail." };
  if (customer.phone.replace(/\D/g, "").length < 9) return { ok: false, error: "Podaj numer telefonu, kurier zadzwoni przed dostawą." };

  const delivery = str(body.delivery) as DeliveryMethod;
  if (!(delivery in DELIVERY)) return { ok: false, error: "Wybierz sposób dostawy." };
  if (delivery === "kurier") {
    if (shippingPaused) return { ok: false, error: "Wysyłka kurierem jest chwilowo wstrzymana. Wybierz odbiór osobisty." };
    if (!customer.street || !customer.city) return { ok: false, error: "Podaj adres dostawy." };
  }

  const day = str(body.day, 10);
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const allowed = delivery === "kurier" ? SHIPPING_WEEKDAYS : PICKUP_WEEKDAYS;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || isoDate(date) !== day || day <= isoDate(today) || !allowed.includes(date.getDay())) {
    return { ok: false, error: delivery === "kurier" ? "Wybierz dzień wysyłki (pon–śr)." : "Wybierz dzień odbioru (pon–sob)." };
  }

  const payment = str(body.payment) as PaymentMethod;
  if (!(payment in PAYMENTS) || (payment === "przy-odbiorze" && delivery !== "odbior")) return { ok: false, error: "Wybierz sposób płatności." };

  const itemsTotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const deliveryPrice = DELIVERY[delivery].price;
  return { ok: true, value: { lines, customer, delivery, day, payment, itemsTotal, deliveryPrice, total: itemsTotal + deliveryPrice } };
}
