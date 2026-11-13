"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPLN, plural } from "@/lib/offers";
import { MAX_UPLOAD_BYTES } from "@/lib/enquiry";
import { CONTACT } from "@/lib/contact";
import { type CartItem, useBlobUrl, useCart } from "./CartProvider";

/** Zmniejsza stopklatkę mocniej, gdy cały koszyk nie mieści się w jednym wysłaniu. */
async function recompress(b: Blob, maxSide: number, quality: number): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(b);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    return out && out.size < b.size ? out : b;
  } catch {
    return b;
  }
}

async function fitShots(items: CartItem[]): Promise<Blob[]> {
  let shots = items.map((it) => it.shot);
  for (const [side, q] of [[1280, 0.8], [1024, 0.72], [800, 0.65]] as const) {
    if (shots.reduce((s, b) => s + b.size, 0) <= MAX_UPLOAD_BYTES) break;
    shots = await Promise.all(shots.map((b) => recompress(b, side, q)));
  }
  return shots;
}

function Item({ item, onRemove, onQty }: { item: CartItem; onRemove: () => void; onQty: (n: number) => void }) {
  const url = useBlobUrl(item.shot);
  return (
    <li className="cart-item">
      <a href={url} target="_blank" rel="noreferrer" className="cart-item__img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt={`Stopklatka z rybą z oferty ${item.title}`} />}
      </a>
      <div className="cart-item__body">
        <Link href={`/oferta/${item.offerId}`}><b>{item.title}</b></Link>
        <span className="small muted">
          {item.price ? `${formatPLN(item.price)} za sztukę` : "cena do ustalenia"}
          {item.second && ` · ${item.second} na filmiku`}
        </span>
        <div className="cart-item__row">
          <label className="small cart-item__qty">
            Sztuk
            <input type="number" inputMode="numeric" min={1} max={20} value={item.qty} onChange={(e) => onQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
          </label>
          <button type="button" className="chip" onClick={onRemove}>Usuń</button>
        </div>
      </div>
    </li>
  );
}

/** Strona koszyka: ryby ze stopklatkami i jeden formularz kontaktowy. Bez płatności online. */
export function CartView() {
  const cart = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const total = cart.items.reduce((s, it) => s + (it.price ?? 0) * it.qty, 0);
  const unpriced = cart.items.filter((it) => !it.price).length;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!cart.items.length) return;
    setState("sending");
    setError("");
    const body = new FormData();
    for (const [k, v] of Object.entries(form)) body.set(k, v);
    body.set("items", JSON.stringify(cart.items.map((it) => ({ offerId: it.offerId, qty: it.qty, second: it.second }))));
    const shots = await fitShots(cart.items);
    shots.forEach((b, i) => body.append(`shot-${i}`, b, `ryba-${i + 1}.jpg`));
    let res: Response;
    try {
      res = await fetch("/api/zapytania", { method: "POST", body });
    } catch {
      setState("error");
      setError("Brak połączenia z internetem. Sprawdź zasięg i wyślij jeszcze raz. Koszyk zostaje zapisany.");
      return;
    }
    if (res.ok) {
      setSentTo(form.phone ? "telefonicznie albo SMS-em" : `na ${form.email}`);
      cart.clear();
      setState("sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const data = await res.json().catch(() => ({}));
    setState("error");
    setError(
      data.error ??
        (res.status === 413
          ? "Zdjęcia są za duże, żeby wysłać je naraz. Usuń jedną rybę z koszyka i wyślij ją osobno."
          : `Nie udało się wysłać zgłoszenia (błąd ${res.status}). Spróbuj jeszcze raz albo zadzwoń: ${CONTACT.phone}.`),
    );
  }

  if (state === "sent") {
    return (
      <div className="panel">
        <p className="notice" role="status">
          Dziękujemy, mamy Twoje zgłoszenie. Odezwiemy się {sentTo}, potwierdzimy ryby i cenę, i umówimy odbiór osobisty w Zakrzewie.
        </p>
        <Link href="/katalog" className="btn">Wróć do katalogu</Link>
      </div>
    );
  }

  if (!cart.ready) return <p className="muted">Wczytuję koszyk…</p>;

  if (!cart.items.length) {
    return (
      <div className="panel">
        <p>Koszyk jest pusty.</p>
        <p className="muted small">Otwórz ofertę, kliknij „Zrób stopklatkę” pod filmikiem, zaznacz rybę i dodaj ją do koszyka. Możesz tak zebrać kilka ryb z różnych filmików.</p>
        <Link href="/katalog" className="btn btn--primary">Przejdź do katalogu</Link>
      </div>
    );
  }

  return (
    <div className="cart">
      <section className="stack">
        <ul className="cart-list">
          {cart.items.map((it) => (
            <Item key={it.id} item={it} onRemove={() => cart.remove(it.id)} onQty={(qty) => cart.update(it.id, { qty })} />
          ))}
        </ul>
        <div className="cart-sum">
          <span>
            Razem: <b className="num">{cart.count}</b> {plural(cart.count, "ryba", "ryby", "ryb")}
          </span>
          {total > 0 && (
            <span>
              orientacyjnie <b className="num">{formatPLN(total)}</b>
              {unpriced > 0 && <span className="muted small"> + {unpriced === 1 ? "ryba" : "ryby"} z ceną do ustalenia</span>}
            </span>
          )}
        </div>
        <Link href="/katalog" className="btn">+ Wybierz kolejną rybę</Link>
      </section>

      <form className="panel" onSubmit={send}>
        <h2 className="panel__title">Wyślij zgłoszenie</h2>
        <p className="muted small">Sprawdzimy, czy wszystkie ryby są wolne, potwierdzimy cenę i umówimy odbiór osobisty.</p>
        <label className="field">
          Imię
          <input id="enq-name" required value={form.name} onChange={set("name")} autoComplete="given-name" />
        </label>
        <div className="two">
          <label className="field">
            Telefon
            <input id="enq-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="np. 600 100 200" />
          </label>
          <label className="field">
            E-mail
            <input id="enq-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" />
          </label>
        </div>
        <p className="muted small">Wystarczy telefon albo e-mail.</p>
        <label className="field">
          Wiadomość (opcjonalnie)
          <textarea id="enq-message" rows={3} value={form.message} onChange={set("message")} placeholder="np. mogę przyjechać w sobotę" />
        </label>
        <label className="visually-hidden" aria-hidden="true">
          Strona www
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </label>
        {state === "error" && <p className="notice notice--error" role="alert">{error}</p>}
        <p className="muted small">Nie płacisz teraz. Zapłacisz gotówką przy odbiorze albo przelewem, gdy potwierdzimy ryby.</p>
        <button type="submit" className="btn btn--primary" disabled={state === "sending"}>
          {state === "sending" ? "Wysyłanie…" : `Wyślij zgłoszenie (${cart.count} ${plural(cart.count, "ryba", "ryby", "ryb")})`}
        </button>
        <p className="muted small">
          Dane ze zgłoszenia wykorzystamy tylko do odpowiedzi i sprzedaży ryb. Stopklatki mogą pokazać się pod filmikami jako ryby zarezerwowane,
          bez Twojego imienia i kontaktu. Więcej w <Link href="/polityka-prywatnosci">polityce prywatności</Link>.
        </p>
      </form>
    </div>
  );
}
