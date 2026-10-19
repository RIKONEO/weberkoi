// Płatności online przez Stripe Checkout. Klient płaci na stronie Stripe (BLIK, karta, Przelewy24),
// a o wyniku dowiadujemy się z webhooka i, na wszelki wypadek, przy powrocie klienta do sklepu.
import "server-only";
import Stripe from "stripe";

/** Ile czasu klient ma na zapłatę, zanim zamówienie się anuluje, a ryby wrócą do sprzedaży. */
export const PAYMENT_MINUTES = 45;

let client: Stripe | null = null;

export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // STRIPE_API_URL służy tylko do testów z lokalną atrapą API.
  const api = process.env.STRIPE_API_URL ? new URL(process.env.STRIPE_API_URL) : null;
  client ??= new Stripe(key, api ? { host: api.hostname, port: api.port, protocol: api.protocol.replace(":", "") as "http" | "https" } : {});
  return client;
}

type CheckoutInput = {
  no: string;
  email: string;
  lines: { title: string; qty: number; unitPrice: number }[];
  delivery: { label: string; price: number };
  successUrl: string;
  cancelUrl: string;
};

export async function createCheckout(s: Stripe, o: CheckoutInput) {
  const item = (name: string, zl: number, quantity: number) => ({
    quantity,
    price_data: { currency: "pln", unit_amount: zl * 100, product_data: { name } },
  });
  return s.checkout.sessions.create({
    mode: "payment",
    locale: "pl",
    client_reference_id: o.no,
    customer_email: o.email,
    metadata: { orderNo: o.no },
    payment_intent_data: { description: `Zamówienie ${o.no}`, metadata: { orderNo: o.no } },
    line_items: [...o.lines.map((l) => item(l.title, l.unitPrice, l.qty)), ...(o.delivery.price ? [item(o.delivery.label, o.delivery.price, 1)] : [])],
    expires_at: Math.floor(Date.now() / 1000) + PAYMENT_MINUTES * 60,
    success_url: o.successUrl,
    cancel_url: o.cancelUrl,
  });
}
