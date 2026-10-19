// Webhook Stripe: adres https://<domena>/api/stripe, zdarzenia checkout.session.*.
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cancelUnpaidOrder, markOrderPaid } from "@/lib/data";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: "Stripe nie jest skonfigurowany." }, { status: 503 });

  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Zły podpis." }, { status: 400 });
  }
  if (!event.type.startsWith("checkout.session.")) return NextResponse.json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  const no = session.metadata?.orderNo ?? session.client_reference_id;
  if (!no) return NextResponse.json({ received: true });

  switch (event.type) {
    case "checkout.session.completed":
      if (session.payment_status === "paid") await markOrderPaid(no);
      break;
    case "checkout.session.async_payment_succeeded":
      await markOrderPaid(no);
      break;
    case "checkout.session.async_payment_failed":
      await cancelUnpaidOrder(no, "Płatność nie powiodła się, zamówienie anulowane automatycznie.");
      break;
    case "checkout.session.expired":
      await cancelUnpaidOrder(no, "Klient nie zapłacił na czas, zamówienie anulowane automatycznie.");
      break;
  }
  return NextResponse.json({ received: true });
}
