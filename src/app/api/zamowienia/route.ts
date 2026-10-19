import { NextResponse } from "next/server";
import { cancelUnpaidOrder, createOrder, setOrderPayment } from "@/lib/data";
import { DELIVERY } from "@/lib/shipping";
import { createCheckout, stripe } from "@/lib/stripe";

const siteUrl = (req: Request) => (process.env.SITE_URL ?? new URL(req.url).origin).replace(/\/$/, "");

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nieprawidłowe zamówienie." }, { status: 400 });
  const online = (body as Record<string, unknown>).payment === "online";
  const s = stripe();
  if (online && !s) return NextResponse.json({ error: "Płatność online jest chwilowo niedostępna. Wybierz odbiór osobisty i płatność na miejscu." }, { status: 503 });

  const res = await createOrder(body);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 });
  const orderUrl = `${siteUrl(req)}/zamowienie/${res.no}?k=${res.accessKey}`;
  if (!online || !s) return NextResponse.json({ ok: true, orderNo: res.no, redirect: orderUrl });

  try {
    const session = await createCheckout(s, {
      no: res.no,
      email: res.order.customer.email,
      lines: res.order.lines,
      delivery: { label: DELIVERY[res.order.delivery].label, price: res.order.deliveryPrice },
      successUrl: `${orderUrl}&platnosc=ok`,
      cancelUrl: orderUrl,
    });
    await setOrderPayment(res.no, session.id, session.url);
    return NextResponse.json({ ok: true, orderNo: res.no, redirect: session.url });
  } catch (err) {
    console.error("Stripe checkout", err);
    await cancelUnpaidOrder(res.no, "Nie udało się otworzyć płatności Stripe.");
    return NextResponse.json({ error: "Nie udało się otworzyć płatności. Spróbuj ponownie za chwilę." }, { status: 502 });
  }
}
