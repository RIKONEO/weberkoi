"use client";

import { useImperativeHandle, useRef, useState } from "react";
import Link from "next/link";
import { type Offer, type TakenFish, available, formatPLN, plural } from "@/lib/offers";
import { MAX_ITEMS } from "@/lib/enquiry";
import { FishMarker } from "./FishMarker";
import { TakenThumbs } from "./TakenFish";
import { useBlobUrl, useCart } from "./cart/CartProvider";

/** Obrazek czekający na zaznaczenie ryby kółkiem. */
type Pending = { id: number; file: Blob; second?: string; fromVideo?: boolean };

export type EnquiryHandle = {
  /** Dodaje stopklatkę z filmiku: najpierw klient zaznacza na niej rybę. Zwraca powód, gdy się nie da. */
  addFrame: (frame: Blob, second: string) => string | null;
};

/** Zmniejsza zdjęcie w przeglądarce, żeby wysyłka z telefonu była szybka i mieściła się w limicie serwera. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

const FULL = `Koszyk jest pełny (najwyżej ${MAX_ITEMS} ryb w jednym zgłoszeniu). Wyślij go albo usuń którąś rybę.`;

/**
 * Wybór ryby z filmiku do koszyka: stopklatka albo screenshot, kółko wokół ryby, liczba sztuk.
 * Klient może tak dodać kilka ryb z tej i z innych ofert, a potem wysłać jedno zgłoszenie z koszyka.
 */
export function OfferEnquiry({
  offer,
  taken = [],
  frameGrab = false,
  hasMap = false,
  ref,
}: {
  offer: Offer;
  /** Ryby z tego filmiku już zarezerwowane albo sprzedane. */
  taken?: TakenFish[];
  frameGrab?: boolean;
  /** Oferta ma mapę ryb: klient wybiera rybę na mapie, a screenshot zostaje na wszelki wypadek. */
  hasMap?: boolean;
  ref?: React.Ref<EnquiryHandle>;
}) {
  const cart = useCart();
  const left = available(offer);
  const input = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [shot, setShot] = useState<Blob | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [qty, setQty] = useState(1);
  const [second, setSecond] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [checked, setChecked] = useState(false);
  const shotUrl = useBlobUrl(shot ?? undefined);
  const nextId = useRef(0);

  const mine = cart.items.filter((it) => it.offerId === offer.id);
  const inCart = mine.reduce((s, it) => s + it.qty, 0);
  const room = Math.max(0, left - inCart);
  const full = cart.items.length >= MAX_ITEMS;
  const mustCheck = taken.length > 0 && shot !== null;

  useImperativeHandle(ref, () => ({
    addFrame(frame, sec) {
      if (full) return FULL;
      if (room === 0) return "Wszystkie wolne ryby z tego filmiku masz już w koszyku.";
      if (shot || pending) return "Najpierw dodaj zaznaczoną rybę do koszyka albo ją usuń, potem zrób kolejną stopklatkę.";
      setAdded(false);
      setPending({ id: nextId.current++, file: frame, second: sec, fromVideo: true });
      return null;
    },
  }), [full, room, shot, pending]);

  if (left === 0) {
    return <div className="panel"><p className="notice notice--warn">Wszystkie ryby z tej grupy są już sprzedane.</p></div>;
  }

  async function addFile(list: FileList | null) {
    const f = Array.from(list ?? []).find((x) => x.type.startsWith("image/"));
    if (input.current) input.current.value = "";
    if (!f) return;
    setAdded(false);
    setPending({ id: nextId.current++, file: await shrink(f) });
  }

  function marked(file: Blob) {
    const done = pending!;
    setShot(file);
    setPending(null);
    setChecked(false);
    setError("");
    if (done.second) setSecond(done.second);
    // Na telefonie formularz jest pod filmikiem; pokazujemy, że stopklatka do niego trafiła.
    if (done.fromVideo) requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function reset() {
    setShot(null);
    setQty(1);
    setSecond("");
    setChecked(false);
  }

  async function addToCart(e: React.FormEvent) {
    e.preventDefault();
    if (!shot) {
      setError(frameGrab ? "Zrób stopklatkę albo dodaj screenshot z filmiku, na którym widać rybę." : "Dodaj screenshot z filmiku, na którym widać rybę.");
      return;
    }
    if (mustCheck && !checked) {
      setError("Sprawdź, czy Twojej ryby nie ma wśród już wybranych, i zaznacz pole pod nimi.");
      return;
    }
    if (qty > room) {
      setError(`Z tego filmiku możesz dodać jeszcze ${room} ${plural(room, "rybę", "ryby", "ryb")}.`);
      return;
    }
    if (!(await cart.add({ offerId: offer.id, title: offer.title, price: offer.price, qty, second: second.trim().slice(0, 10), shot }))) {
      setError(FULL);
      return;
    }
    setError("");
    reset();
    setAdded(true);
  }

  const canPick = !full && room > 0;

  return (
    <form ref={formRef} className="panel" onSubmit={addToCart}>
      <h2 className="panel__title">Chcę tę rybę</h2>
      {added && (
        <div className="notice added" role="status">
          <b>Ryba jest w koszyku.</b>
          <span className="small">
            W koszyku: {cart.count} {plural(cart.count, "ryba", "ryby", "ryb")}. Możesz wybrać kolejną z tego filmiku, z innej oferty albo wysłać zgłoszenie.
          </span>
          <div className="row">
            <Link href="/koszyk" className="btn btn--primary btn--sm">Przejdź do koszyka</Link>
            <Link href="/katalog" className="btn btn--sm">Inne oferty</Link>
          </div>
        </div>
      )}
      {!shot && canPick && hasMap && (
        <ol className="howto small">
          <li>Pod filmikiem jest mapa ryb z numerami. Stuknij w <b>zieloną</b> (wolną) rybę i dodaj ją do koszyka.</li>
          <li>Żółte ktoś już zarezerwował, szare są sprzedane. Na filmiku zobaczysz, jak wybrana ryba pływa.</li>
          <li>Wybierz tak kolejne ryby, też z innych filmików, i wyślij jedno zgłoszenie z koszyka. Resztę ustalimy z Tobą sami.</li>
        </ol>
      )}
      {!shot && canPick && hasMap && <p className="small muted">Twojej ryby nie ma na mapie? Dodaj screenshot z filmiku:</p>}
      {!shot && canPick && !hasMap && (
        <ol className="howto small">
          {frameGrab ? (
            <li>Kliknij „Zrób stopklatkę” pod filmikiem i suwakiem wybierz moment, w którym dobrze widać rybę. Możesz też dodać własny screenshot.</li>
          ) : (
            <li>Zatrzymaj filmik, gdy dobrze widać wybraną rybę, zrób screenshot (zrzut ekranu) i dodaj go tutaj.</li>
          )}
          <li>Stuknij w rybę, żeby zaznaczyć ją kółkiem, i dodaj ją do koszyka.</li>
          <li>Wybierz tak kolejne ryby, też z innych filmików, i wyślij jedno zgłoszenie z koszyka. Resztę ustalimy z Tobą sami.</li>
        </ol>
      )}
      {pending && <FishMarker key={pending.id} image={pending.file} onDone={marked} onCancel={() => setPending(null)} />}

      {full && !shot && <p className="notice notice--warn small">{FULL}</p>}
      {!full && room === 0 && !shot && <p className="notice small">Wszystkie wolne ryby z tego filmiku masz już w koszyku.</p>}

      {(shot || canPick) && (
        <div className="shots">
          {shot && shotUrl ? (
            <figure className="shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shotUrl} alt="Stopklatka z zaznaczoną rybą" />
              <button type="button" className="shot__remove" aria-label="Usuń stopklatkę" onClick={reset}>×</button>
            </figure>
          ) : (
            <label className="shot shot--add">
              <input ref={input} type="file" accept="image/*" className="visually-hidden" onChange={(e) => addFile(e.target.files)} />
              <span>+ Dodaj screenshot</span>
            </label>
          )}
        </div>
      )}

      {mustCheck && (
        <div className="notice notice--warn taken-check">
          <b>Sprawdź, czy Twojej ryby nie ma wśród tych.</b>
          <span className="small">Te ryby z filmiku ktoś już wybrał. Porównaj je ze swoją stopklatką.</span>
          <TakenThumbs taken={taken} small />
          <label className="check small">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            Sprawdziłem/am, mojej ryby tu nie ma
          </label>
        </div>
      )}

      {shot && (
        <>
          <div className="two">
            <label className="field">
              Ile ryb z tej stopklatki
              <input type="number" inputMode="numeric" min={1} max={room} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(room, Number(e.target.value) || 1)))} />
            </label>
            <label className="field">
              Sekunda filmiku (opcjonalnie)
              <input id="video-second" value={second} onChange={(e) => setSecond(e.target.value)} placeholder="np. 0:42" />
            </label>
          </div>
          {offer.price && <p className="small muted">{formatPLN(offer.price)} za sztukę. Nie płacisz teraz.</p>}
          {error && <p className="notice notice--error" role="alert">{error}</p>}
          <button type="submit" className="btn btn--primary">Dodaj do koszyka</button>
        </>
      )}
      {!shot && error && <p className="notice notice--error" role="alert">{error}</p>}

      {mine.length > 0 && !added && (
        <p className="small muted">
          Z tego filmiku masz w koszyku {inCart} {plural(inCart, "rybę", "ryby", "ryb")}. <Link href="/koszyk">Zobacz koszyk ({cart.count})</Link>
        </p>
      )}
    </form>
  );
}
