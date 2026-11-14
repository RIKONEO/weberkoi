"use client";

import { useState } from "react";
import Link from "next/link";
import { type FishMap as FishMapData, type MapMarker, type MapStatuses, type Offer, available, formatPLN, plural } from "@/lib/offers";
import { MAX_ITEMS } from "@/lib/enquiry";
import { useCart } from "./cart/CartProvider";

type PinState = "wolna" | "zarezerwowana" | "sprzedana" | "koszyk";

const LABEL: Record<PinState, string> = {
  wolna: "wolna",
  zarezerwowana: "zarezerwowana",
  sprzedana: "sprzedana",
  koszyk: "w Twoim koszyku",
};

/**
 * Stopklatka do koszyka: cała klatka mapy z żółtym kółkiem i numerem wybranej ryby, tak jak przy
 * własnej stopklatce klienta. Dzięki temu panel, maile i koszyk działają bez zmian.
 */
async function markedShot(src: string, m: MapMarker): Promise<Blob> {
  const blob = await (await fetch(src)).blob();
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const side = Math.min(canvas.width, canvas.height);
  const x = m.x * canvas.width, y = m.y * canvas.height, r = side * 0.08, line = Math.max(3, side * 0.008);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = line * 2.2;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.65)";
  ctx.stroke();
  ctx.lineWidth = line;
  ctx.strokeStyle = "#ffd60a";
  ctx.stroke();
  // Numer ryby w żółtym kółeczku nad zaznaczeniem.
  const fs = Math.max(16, side * 0.05);
  ctx.font = `800 ${fs}px sans-serif`;
  const label = `nr ${m.n}`;
  const w = ctx.measureText(label).width + fs * 0.8;
  const bx = Math.min(Math.max(x - w / 2, 4), canvas.width - w - 4);
  const by = Math.max(4, y - r - fs * 1.6);
  ctx.fillStyle = "#ffd60a";
  ctx.beginPath();
  ctx.roundRect(bx, by, w, fs * 1.4, fs * 0.7);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx + fs * 0.4, by + fs * 0.72);
  const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  if (!out) throw new Error("brak obrazka");
  return out;
}

/**
 * Wspólna mapa ryb pod filmikiem: jedna klatka z ponumerowanymi rybami. Zielone są wolne, żółte
 * zarezerwowane, szare sprzedane. Klient stuka w wolną rybę i dodaje ją do koszyka, a na filmiku
 * może podejrzeć, jak pływa.
 */
export function FishMap({ offer, map, statuses }: { offer: Offer; map: FishMapData; statuses: MapStatuses }) {
  const cart = useCart();
  const [selected, setSelected] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<number | null>(null);
  const src = `/mapa/${offer.id}?v=${map.version}`;

  const inCart = new Set(cart.items.filter((it) => it.offerId === offer.id && it.fishNo).map((it) => it.fishNo!));
  const stateOf = (n: number): PinState => statuses[n] ?? (inCart.has(n) ? "koszyk" : "wolna");
  const counts = { wolna: 0, zarezerwowana: 0, sprzedana: 0, koszyk: 0 };
  for (const m of map.markers) counts[stateOf(m.n)]++;
  const room = available(offer) - cart.items.filter((it) => it.offerId === offer.id).reduce((s, it) => s + it.qty, 0);

  const sel = selected != null ? map.markers.find((m) => m.n === selected) : undefined;
  const selState = sel ? stateOf(sel.n) : undefined;

  function pick(n: number) {
    setError("");
    setAdded(null);
    setSelected((cur) => (cur === n ? null : n));
  }

  async function add() {
    if (!sel || busy) return;
    if (cart.items.length >= MAX_ITEMS) return setError(`Koszyk jest pełny (najwyżej ${MAX_ITEMS} ryb w jednym zgłoszeniu). Wyślij go albo usuń którąś rybę.`);
    if (room <= 0) return setError("Wszystkie wolne ryby z tego filmiku masz już w koszyku.");
    setBusy(true);
    try {
      const shot = await markedShot(src, sel);
      if (!(await cart.add({ offerId: offer.id, title: offer.title, price: offer.price, qty: 1, second: "", fishNo: sel.n, shot }))) {
        setError(`Koszyk jest pełny (najwyżej ${MAX_ITEMS} ryb w jednym zgłoszeniu).`);
        return;
      }
      setAdded(sel.n);
      setSelected(null);
    } catch {
      setError("Nie udało się dodać ryby. Odśwież stronę i spróbuj jeszcze raz.");
    } finally {
      setBusy(false);
    }
  }

  function removeFromCart(n: number) {
    const it = cart.items.find((i) => i.offerId === offer.id && i.fishNo === n);
    if (it) cart.remove(it.id);
    setSelected(null);
  }

  return (
    <section className="fishmap" aria-labelledby="fishmap-title">
      <div className="fishmap__head">
        <h2 id="fishmap-title" className="fishmap__title">Wybierz rybę</h2>
        <button type="button" className="chip" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
          {zoom ? "Pomniejsz" : "Powiększ"}
        </button>
      </div>
      <p className="muted small">
        Stuknij w <b className="fishmap__c--wolna">zieloną</b> rybę i dodaj ją do koszyka. Na filmiku wyżej zobaczysz, jak pływa. Podaj nam numer, jeśli dzwonisz.
      </p>
      <div className={zoom ? "fishmap__scroll fishmap__scroll--zoom" : "fishmap__scroll"}>
        <div className="fishmap__stage" style={{ aspectRatio: `${map.width} / ${map.height}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Klatka z filmiku z ponumerowanymi rybami: ${offer.title}`} draggable={false} />
          {map.markers.map((m) => {
            const st = stateOf(m.n);
            return (
              <button
                key={m.n}
                type="button"
                className={`fishmap__pin fishmap__pin--${st}${selected === m.n ? " is-selected" : ""}`}
                style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                onClick={() => pick(m.n)}
                aria-label={`Ryba nr ${m.n}, ${LABEL[st]}`}
                aria-pressed={selected === m.n}
              >
                {m.n}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="fishmap__legend small" aria-label="Legenda">
        <li><i className="fishmap__dot fishmap__dot--wolna" />Wolne: {counts.wolna}</li>
        {counts.koszyk > 0 && <li><i className="fishmap__dot fishmap__dot--koszyk" />W koszyku: {counts.koszyk}</li>}
        <li><i className="fishmap__dot fishmap__dot--zarezerwowana" />Zarezerwowane: {counts.zarezerwowana}</li>
        <li><i className="fishmap__dot fishmap__dot--sprzedana" />Sprzedane: {counts.sprzedana}</li>
      </ul>

      {sel && (
        <div className="fishmap__bar" role="status">
          <div>
            <b>Ryba nr {sel.n}</b>
            <span className="small muted">
              {" · "}
              {selState === "wolna" && (offer.price ? `${formatPLN(offer.price)}, płatność przy odbiorze` : "cena do ustalenia")}
              {selState === "zarezerwowana" && "ktoś już ją wybrał i czeka na potwierdzenie"}
              {selState === "sprzedana" && "już sprzedana"}
              {selState === "koszyk" && "jest w Twoim koszyku"}
            </span>
          </div>
          {selState === "wolna" && (
            <button type="button" className="btn btn--primary" onClick={add} disabled={busy}>
              {busy ? "Dodaję…" : `Dodaj nr ${sel.n} do koszyka`}
            </button>
          )}
          {selState === "koszyk" && (
            <div className="row">
              <Link href="/koszyk" className="btn btn--primary btn--sm">Koszyk</Link>
              <button type="button" className="chip" onClick={() => removeFromCart(sel.n)}>Usuń z koszyka</button>
            </div>
          )}
        </div>
      )}
      {error && <p className="notice notice--error small" role="alert">{error}</p>}
      {added != null && (
        <div className="notice added" role="status">
          <b>Ryba nr {added} jest w koszyku.</b>
          <span className="small">
            W koszyku: {cart.count} {plural(cart.count, "ryba", "ryby", "ryb")}. Wybierz kolejną albo wyślij zgłoszenie.
          </span>
          <div className="row">
            <Link href="/koszyk" className="btn btn--primary btn--sm">Przejdź do koszyka</Link>
            <Link href="/katalog" className="btn btn--sm">Inne oferty</Link>
          </div>
        </div>
      )}
    </section>
  );
}
