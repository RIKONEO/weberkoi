"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Offer, available, formatPLN, sizeLabel } from "@/lib/offers";
import { useCart } from "./cart/CartProvider";

type Mode = "group" | "pick";

export function OfferPurchase({ offer }: { offer: Offer }) {
  const router = useRouter();
  const { add } = useCart();
  const left = available(offer);
  const [mode, setMode] = useState<Mode>("group");
  const [qty, setQty] = useState(1);
  const [picks, setPicks] = useState<number[]>([]);
  const [second, setSecond] = useState("");
  const [ask, setAsk] = useState({ name: "", email: "", message: "" });
  const [askState, setAskState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [askError, setAskError] = useState("");

  const n = mode === "group" ? qty : picks.length;
  const selection = mode === "pick" ? (picks.length ? `ryby nr ${picks.join(", ")}` : "") : `${qty} szt. z grupy`;

  if (left === 0) {
    return <div className="panel"><p className="notice notice--warn">Wszystkie ryby z tej grupy są już sprzedane.</p></div>;
  }

  function toggle(k: number) {
    setPicks((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k].sort((a, b) => a - b)));
  }

  function addToCart() {
    if (!offer.price || !n) return;
    add({
      offerId: offer.id,
      title: offer.title,
      variety: offer.variety,
      size: sizeLabel(offer),
      unitPrice: offer.price,
      qty: n,
      picks: mode === "pick" ? picks : null,
    });
    router.push("/koszyk");
  }

  async function sendAsk(e: React.FormEvent) {
    e.preventDefault();
    setAskState("sending");
    setAskError("");
    try {
      const res = await fetch("/api/zapytania", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: offer.id, mode, qty: n, picks: mode === "pick" ? picks : null, second, ...ask }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nie udało się wysłać zapytania.");
      setAskState("sent");
    } catch (err) {
      setAskState("error");
      setAskError(err instanceof Error ? err.message : "Nie udało się wysłać zapytania.");
    }
  }

  return (
    <div className="panel">
      <div className="seg" role="group" aria-label="Sposób wyboru ryby">
        <button type="button" aria-pressed={mode === "group"} onClick={() => setMode("group")}>
          Ryba z grupy
        </button>
        <button type="button" aria-pressed={mode === "pick"} onClick={() => setMode("pick")}>
          Wybieram konkretną
        </button>
      </div>

      {mode === "group" ? (
        <>
          <p className="muted small">Wybierzemy dla Ciebie najładniejsze ryby z tej grupy.</p>
          <div className="qty">
            <button type="button" aria-label="Mniej" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <output className="num" aria-live="polite">{qty}</output>
            <button type="button" aria-label="Więcej" onClick={() => setQty((q) => Math.min(left, q + 1))}>+</button>
            <span className="muted small">z {left} dostępnych</span>
          </div>
        </>
      ) : (
        <>
          <p className="muted small">Kliknij numer ryby z filmiku. Przekreślone są już sprzedane.</p>
          <div className="fish-grid">
            {Array.from({ length: offer.count }, (_, i) => i + 1).map((k) => (
              <button
                key={k}
                type="button"
                className="num"
                disabled={offer.sold.includes(k)}
                aria-pressed={picks.includes(k)}
                aria-label={offer.sold.includes(k) ? `Ryba ${k}, sprzedana` : `Ryba ${k}`}
                onClick={() => toggle(k)}
              >
                {k}
              </button>
            ))}
          </div>
          <label className="field">
            Sekunda filmiku, w której ją widać (opcjonalnie)
            <input id="video-second" value={second} onChange={(e) => setSecond(e.target.value)} placeholder="np. 0:42" />
          </label>
        </>
      )}

      {offer.price ? (
        <>
          <div className="total">
            <span>Razem</span>
            <b className="num">{formatPLN(n * offer.price)}</b>
          </div>
          <button type="button" className="btn btn--primary" disabled={!n} onClick={addToCart}>
            Dodaj do koszyka
          </button>
        </>
      ) : askState === "sent" ? (
        <p className="notice">Zapytanie wysłane. Odpowiemy na {ask.email} z ceną i linkiem do płatności.</p>
      ) : (
        <form className="stack" onSubmit={sendAsk}>
          <p className="notice notice--warn">Cenę tej grupy ustalamy indywidualnie. Odpowiemy mailem z ceną i linkiem do płatności.</p>
          <div className="two">
            <label className="field">
              Imię
              <input id="ask-name" required value={ask.name} onChange={(e) => setAsk({ ...ask, name: e.target.value })} autoComplete="given-name" />
            </label>
            <label className="field">
              E-mail
              <input id="ask-email" type="email" required value={ask.email} onChange={(e) => setAsk({ ...ask, email: e.target.value })} autoComplete="email" />
            </label>
          </div>
          <label className="field">
            Wiadomość (opcjonalnie)
            <textarea id="ask-message" rows={3} value={ask.message} onChange={(e) => setAsk({ ...ask, message: e.target.value })} placeholder={selection ? `Interesuje mnie: ${selection}.` : ""} />
          </label>
          {askState === "error" && <p className="notice notice--error">{askError}</p>}
          <button type="submit" className="btn btn--primary" disabled={!n || askState === "sending"}>
            {askState === "sending" ? "Wysyłanie…" : "Zapytaj o cenę"}
          </button>
        </form>
      )}
    </div>
  );
}
