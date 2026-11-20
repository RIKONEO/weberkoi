"use client";

import { useState } from "react";
import Link from "next/link";
import { ART, formatPLN, offerPath, plural } from "@/lib/offers";
import { MAX_UPLOAD_BYTES } from "@/lib/enquiry";
import { CONTACT } from "@/lib/contact";
import { PICKUP_RULE, PICKUP_TEXT, formatDay, pickupDeadline } from "@/lib/pickup";
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

/** „ryba/ryby/ryb”, a gdy w koszyku są też obrazy z metalu: „pozycja/pozycje/pozycji”. */
function noun(items: CartItem[], n: number) {
  return items.some((it) => it.kind === "obraz") ? plural(n, "pozycja", "pozycje", "pozycji") : plural(n, "ryba", "ryby", "ryb");
}

function Item({ item, onRemove, onQty }: { item: CartItem; onRemove: () => void; onQty: (n: number) => void }) {
  const url = useBlobUrl(item.shot);
  const art = item.kind === "obraz";
  return (
    <li className="cart-item">
      <a href={url} target="_blank" rel="noreferrer" className="cart-item__img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt={art ? `Obraz ${item.title}` : `Stopklatka z rybą z oferty ${item.title}`} />}
      </a>
      <div className="cart-item__body">
        <Link href={offerPath({ id: item.offerId, kind: art ? "obraz" : "ryba" })}><b>{item.title}</b></Link>
        <span className="small muted">
          {art && "Obraz ze stali z podświetleniem LED · "}
          {item.price ? `${formatPLN(item.price)} za sztukę` : "cena do ustalenia"}
          {item.second && ` · ${item.second} na filmiku`}
        </span>
        {item.fishNo && <span className="small"><b>Ryba nr {item.fishNo}</b> z mapy pod filmikiem</span>}
        <div className="cart-item__row">
          {!item.fishNo && (
            <label className="small cart-item__qty">
              Sztuk
              <input type="number" inputMode="numeric" min={1} max={20} value={item.qty} onChange={(e) => onQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
            </label>
          )}
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
    body.set("items", JSON.stringify(cart.items.map((it) => ({ offerId: it.offerId, qty: it.qty, second: it.second, fishNo: it.fishNo }))));
    const shots = await fitShots(cart.items);
    shots.forEach((b, i) => body.append(`shot-${i}`, b, `${cart.items[i].kind === "obraz" ? "obraz" : "ryba"}-${i + 1}.jpg`));
    let res: Response;
    try {
      res = await fetch("/api/zapytania", { method: "POST", body });
    } catch {
      setState("error");
      setError("Brak połączenia z internetem. Sprawdź zasięg i wyślij jeszcze raz. Koszyk zostaje zapisany.");
      return;
    }
    if (res.ok) {
      setSentTo(formatDay(pickupDeadline()));
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
          Dziękujemy, zgłoszenie dotarło i wszystko jest zarezerwowane. Zadzwonimy, potwierdzimy szczegóły i cenę, i umówimy odbiór osobisty w Zakrzewie.
          <br />
          <b>Odbierz zamówione rzeczy najpóźniej {sentTo}.</b> Po tym terminie wracają do sprzedaży.
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
        <p className="muted small">Otwórz ofertę i stuknij w wolną (zieloną) rybę na mapie pod filmikiem albo zrób stopklatkę i zaznacz na niej rybę. Możesz tak zebrać kilka ryb z różnych filmików.</p>
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
            Razem: <b className="num">{cart.count}</b> {noun(cart.items, cart.count)}
          </span>
          {total > 0 && (
            <span>
              orientacyjnie <b className="num">{formatPLN(total)}</b>
              {unpriced > 0 && <span className="muted small"> + pozycje z ceną do ustalenia</span>}
            </span>
          )}
        </div>
        <div className="row">
          <Link href="/katalog" className="btn">+ Wybierz kolejną rybę</Link>
          <Link href={ART.path} className="btn">+ Obrazy {ART.name}</Link>
        </div>
      </section>

      <form className="panel" onSubmit={send}>
        <h2 className="panel__title">Wyślij zgłoszenie</h2>
        <p className="muted small">Sprawdzimy, czy wszystko jest wolne, potwierdzimy cenę i umówimy odbiór osobisty.</p>
        <label className="field">
          Imię
          <input id="enq-name" required value={form.name} onChange={set("name")} autoComplete="given-name" />
        </label>
        <div className="two">
          <label className="field">
            Telefon
            <input id="enq-phone" type="tel" required value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="np. 600 100 200" />
          </label>
          <label className="field">
            E-mail (opcjonalnie)
            <input id="enq-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" />
          </label>
        </div>
        <p className="muted small">Zadzwonimy, żeby potwierdzić rezerwację i umówić odbiór. Na e-mail wyślemy potwierdzenie ze zdjęciami.</p>
        <label className="field">
          Wiadomość (opcjonalnie)
          <textarea id="enq-message" rows={3} value={form.message} onChange={set("message")} placeholder="np. mogę przyjechać w sobotę" />
        </label>
        <label className="visually-hidden" aria-hidden="true">
          Strona www
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </label>
        {state === "error" && <p className="notice notice--error" role="alert">{error}</p>}
        <p className="notice notice--warn small"><b>Odbiór w ciągu {PICKUP_TEXT}.</b> {PICKUP_RULE}</p>
        <p className="muted small">Nie płacisz teraz. Zapłacisz gotówką przy odbiorze albo przelewem, gdy potwierdzimy zgłoszenie.</p>
        <button type="submit" className="btn btn--primary" disabled={state === "sending"}>
          {state === "sending" ? "Wysyłanie…" : `Wyślij zgłoszenie (${cart.count} ${noun(cart.items, cart.count)})`}
        </button>
        <p className="muted small">
          Dane ze zgłoszenia wykorzystamy tylko do odpowiedzi i sprzedaży. Stopklatki mogą pokazać się pod filmikami jako ryby zarezerwowane,
          bez Twojego imienia i kontaktu. Więcej w <Link href="/polityka-prywatnosci">polityce prywatności</Link>.
        </p>
      </form>
    </div>
  );
}
