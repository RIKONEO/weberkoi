"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatPLN } from "@/lib/offers";
import { PAYMENTS, type PaymentMethod } from "@/lib/orders";
import { DELIVERY, type DeliveryMethod, PICKUP_WEEKDAYS, SHIPPING_WEEKDAYS, formatDay, nextDays } from "@/lib/shipping";

export function CheckoutForm({ shippingPaused }: { shippingPaused: boolean }) {
  const { lines, ready, total } = useCart();
  const [delivery, setDelivery] = useState<DeliveryMethod>(shippingPaused ? "odbior" : "kurier");
  const days = useMemo(() => nextDays(delivery === "kurier" ? SHIPPING_WEEKDAYS : PICKUP_WEEKDAYS, 4), [delivery]);
  const [day, setDay] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("online");
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", street: "", city: "" });
  const [terms, setTerms] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => setDay(days[0]), [days]);
  useEffect(() => {
    if (payment === "przy-odbiorze" && delivery !== "odbior") setPayment("online");
  }, [delivery, payment]);

  const deliveryPrice = DELIVERY[delivery].price;
  const payments = (Object.keys(PAYMENTS) as PaymentMethod[]).filter((p) => p !== "przy-odbiorze" || delivery === "odbior");
  const set = (k: keyof typeof customer) => (e: React.ChangeEvent<HTMLInputElement>) => setCustomer({ ...customer, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/zamowienia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.map(({ offerId, qty, picks }) => ({ offerId, qty, picks })), customer, delivery, day, payment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nie udało się złożyć zamówienia.");
      // Dalej strona płatności Stripe albo, przy płatności na miejscu, strona zamówienia (ona czyści koszyk).
      window.location.assign(data.redirect);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Nie udało się złożyć zamówienia.");
    }
  }

  if (ready && !lines.length) {
    return (
      <div className="wrap section flow">
        <h1 className="page-title">Kasa</h1>
        <p className="empty">Koszyk jest pusty.</p>
        <div><Link href="/katalog" className="btn">Przejdź do katalogu</Link></div>
      </div>
    );
  }

  return (
    <form className="wrap section flow" onSubmit={submit}>
      <h1 className="page-title">Kasa</h1>

      <fieldset>
        <legend>Dane</legend>
        <div className="two">
          <label className="field">Imię i nazwisko<input id="c-name" required value={customer.name} onChange={set("name")} autoComplete="name" /></label>
          <label className="field">Telefon<input id="c-phone" required type="tel" value={customer.phone} onChange={set("phone")} autoComplete="tel" /></label>
        </div>
        <label className="field">E-mail<input id="c-email" required type="email" value={customer.email} onChange={set("email")} autoComplete="email" /></label>
      </fieldset>

      <fieldset>
        <legend>Dostawa</legend>
        {shippingPaused && <p className="notice notice--warn">Wysyłka kurierem jest chwilowo wstrzymana z powodu pogody. Dostępny jest odbiór osobisty.</p>}
        <div className="opts">
          {(Object.keys(DELIVERY) as DeliveryMethod[]).map((k) => (
            <label key={k} className="opt">
              <input type="radio" name="delivery" value={k} checked={delivery === k} disabled={k === "kurier" && shippingPaused} onChange={() => setDelivery(k)} />
              <span>{DELIVERY[k].label}<small>{DELIVERY[k].note}</small></span>
              <span className="opt__price num">{formatPLN(DELIVERY[k].price)}</span>
            </label>
          ))}
        </div>
        <p className="muted small">
          {delivery === "kurier" ? "Dzień wysyłki. Wysyłamy pon–śr, żeby ryby nie czekały w sortowni przez weekend." : "Dzień odbioru"}
        </p>
        <div className="row" role="radiogroup" aria-label={delivery === "kurier" ? "Dzień wysyłki" : "Dzień odbioru"}>
          {days.map((d) => (
            <button key={d} type="button" role="radio" className="chip" aria-checked={day === d} onClick={() => setDay(d)}>
              {formatDay(d)}
            </button>
          ))}
        </div>
        {delivery === "kurier" && (
          <div className="two">
            <label className="field">Ulica i numer<input id="c-street" required value={customer.street} onChange={set("street")} autoComplete="street-address" /></label>
            <label className="field">Kod pocztowy i miasto<input id="c-city" required value={customer.city} onChange={set("city")} autoComplete="address-level2" /></label>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend>Płatność</legend>
        <div className="opts">
          {payments.map((p) => (
            <label key={p} className="opt">
              <input type="radio" name="payment" value={p} checked={payment === p} onChange={() => setPayment(p)} />
              <span>{PAYMENTS[p].label}<small>{PAYMENTS[p].note}</small></span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="sum">
        <span>Ryby</span><span className="num">{formatPLN(total)}</span>
        <span>Dostawa</span><span className="num">{formatPLN(deliveryPrice)}</span>
        <span className="sum__total">Do zapłaty</span><span className="sum__total num">{formatPLN(total + deliveryPrice)}</span>
      </div>

      <label className="opt">
        <input type="checkbox" id="terms" required checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>Akceptuję regulamin i zasady wysyłki żywych ryb</span>
      </label>
      {state === "error" && <p className="notice notice--error" role="alert">{error}</p>}
      <div className="row row--end">
        <button type="submit" className="btn btn--primary" disabled={state === "sending" || !lines.length}>
          {state === "sending" ? "Wysyłanie…" : payment === "online" ? "Zamawiam i płacę" : "Zamawiam"}
        </button>
      </div>
    </form>
  );
}
