import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/cart/ClearCart";
import { cancelUnpaidOrder, getCustomerOrder, markOrderPaid } from "@/lib/data";
import { formatPLN } from "@/lib/offers";
import { PAYMENT_MINUTES, stripe } from "@/lib/stripe";
import { formatDay } from "@/lib/shipping";

export const metadata: Metadata = { title: "Zamówienie", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ no: string }>; searchParams: Promise<{ k?: string; platnosc?: string }> };

/** Sprawdza płatność bezpośrednio w Stripe, gdyby klient wrócił szybciej niż webhook. */
async function syncPayment(no: string, sessionId: string) {
  const s = stripe();
  if (!s) return;
  try {
    const session = await s.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") await markOrderPaid(no);
    else if (session.status === "expired") await cancelUnpaidOrder(no, "Klient nie zapłacił na czas, zamówienie anulowane automatycznie.");
  } catch (err) {
    console.error("Stripe retrieve", err);
  }
}

export default async function CustomerOrderPage({ params, searchParams }: Props) {
  const [{ no }, sp] = await Promise.all([params, searchParams]);
  const key = sp.k ?? "";
  let o = await getCustomerOrder(no, key);
  if (!o) notFound();
  if (o.payment === "online" && !o.paidAt && o.status === "nowe" && o.stripeSessionId) {
    await syncPayment(no, o.stripeSessionId);
    o = (await getCustomerOrder(no, key))!;
  }

  const cancelled = o.status === "anulowane";
  const awaitingPayment = o.payment === "online" && !o.paidAt && !cancelled;
  const when =
    o.delivery === "kurier"
      ? `Wyślemy ryby w ${formatDay(o.day, true)}. Numer przesyłki dostaniesz e-mailem.`
      : `Ryby będą czekać na odbiór w ${formatDay(o.day, true)}, 10:00–18:00.`;

  return (
    <div className="wrap section flow">
      <ClearCart />
      <div className="eyebrow">Zamówienie {o.no}</div>
      {cancelled ? (
        <>
          <h1 className="page-title">Zamówienie anulowane.</h1>
          <p className="notice notice--warn">
            {o.payment === "online" && !o.paidAt
              ? "Płatność nie doszła na czas, więc ryby wróciły do sprzedaży. Możesz złożyć zamówienie jeszcze raz."
              : "To zamówienie zostało anulowane. W razie pytań napisz do nas."}
          </p>
          <div><Link href="/katalog" className="btn">Wróć do katalogu</Link></div>
        </>
      ) : awaitingPayment ? (
        <>
          <h1 className="page-title">Czekamy na płatność.</h1>
          <p className="notice notice--warn">
            {sp.platnosc === "ok"
              ? "Stripe przyjął płatność, a my czekamy na jej potwierdzenie. Odśwież stronę za chwilę."
              : `Ryby są zarezerwowane dla Ciebie przez ${PAYMENT_MINUTES} minut od złożenia zamówienia. Jeśli płatność się nie uda, rezerwacja wygaśnie.`}
          </p>
          <div className="sum"><span className="sum__total">Do zapłaty</span><span className="sum__total num">{formatPLN(o.total)}</span></div>
          <div className="row">
            {o.paymentUrl && sp.platnosc !== "ok" && <a href={o.paymentUrl} className="btn btn--primary">Przejdź do płatności</a>}
            <Link href={`/zamowienie/${o.no}?k=${key}`} className="btn">Odśwież</Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="page-title">Dziękujemy za zamówienie.</h1>
          <p className="notice">
            {when} Podsumowanie wyślemy na {o.email}.
          </p>
          <div className="sum">
            <span className="sum__total">{o.paidAt ? "Zapłacono" : "Do zapłaty przy odbiorze"}</span>
            <span className="sum__total num">{formatPLN(o.total)}</span>
          </div>
          <p className="muted small">Zachowaj ten link, żeby później sprawdzić stan zamówienia.</p>
          <div><Link href="/katalog" className="btn">Wróć do katalogu</Link></div>
        </>
      )}
    </div>
  );
}
