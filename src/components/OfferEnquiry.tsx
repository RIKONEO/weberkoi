"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { type Offer, available } from "@/lib/offers";
import { MAX_SCREENSHOTS } from "@/lib/enquiry";
import { FishMarker } from "./FishMarker";

type Shot = { file: Blob; name: string; url: string };
/** Obrazek czekający na zaznaczenie ryby kółkiem. */
type Pending = { id: number; file: Blob; name: string; second?: string; fromVideo?: boolean };

export type EnquiryHandle = {
  /** Dodaje stopklatkę z filmiku: najpierw klient zaznacza na niej rybę. Zwraca false, gdy nie ma już miejsca. */
  addFrame: (frame: Blob, second: string) => boolean;
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

export function OfferEnquiry({ offer, frameGrab = false, ref }: { offer: Offer; frameGrab?: boolean; ref?: React.Ref<EnquiryHandle> }) {
  const left = available(offer);
  const input = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [queue, setQueue] = useState<Pending[]>([]);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", email: "", second: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const urls = useRef<string[]>([]);
  const nextId = useRef(0);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const free = MAX_SCREENSHOTS - shots.length - queue.length;
  useImperativeHandle(ref, () => ({
    addFrame(frame, second) {
      if (free <= 0) return false;
      setQueue((q) => [...q, { id: nextId.current++, file: frame, name: "stopklatka.jpg", second, fromVideo: true }]);
      return true;
    },
  }), [free]);

  if (left === 0) {
    return <div className="panel"><p className="notice notice--warn">Wszystkie ryby z tej grupy są już sprzedane.</p></div>;
  }

  async function addFiles(list: FileList | null) {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/")).slice(0, free);
    const next = await Promise.all(files.map(async (f) => ({ id: nextId.current++, file: await shrink(f), name: f.name })));
    setQueue((q) => [...q, ...next]);
    if (input.current) input.current.value = "";
  }

  function marked(file: Blob) {
    const done = queue[0];
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    setShots((cur) => [...cur, { file, name: done.name, url }]);
    setQueue((q) => q.slice(1));
    if (done.second && !form.second) setForm((f) => ({ ...f, second: done.second! }));
    // Na telefonie formularz jest pod filmikiem; pokazujemy, że stopklatka do niego trafiła.
    if (done.fromVideo) requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function removeShot(i: number) {
    URL.revokeObjectURL(shots[i].url);
    setShots((cur) => cur.filter((_, j) => j !== i));
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!shots.length) {
      setState("error");
      setError(frameGrab ? "Zrób stopklatkę albo dodaj screenshot z filmiku, na którym widać rybę." : "Dodaj screenshot z filmiku, na którym widać rybę.");
      return;
    }
    setState("sending");
    setError("");
    const body = new FormData();
    body.set("offerId", offer.id);
    body.set("qty", String(qty));
    for (const [k, v] of Object.entries(form)) body.set(k, v);
    shots.forEach((s, i) => body.append("screenshot", s.file, `screenshot-${i + 1}.jpg`));
    try {
      const res = await fetch("/api/zapytania", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Nie udało się wysłać zgłoszenia.");
      setState("sent");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Nie udało się wysłać zgłoszenia.");
    }
  }

  if (state === "sent") {
    return (
      <div className="panel">
        <p className="notice" role="status">
          Dziękujemy, mamy Twoje zgłoszenie. Odezwiemy się {form.phone ? "telefonicznie albo SMS-em" : `na ${form.email}`}, potwierdzimy rybę i ustalimy płatność oraz odbiór.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} className="panel" onSubmit={send}>
      <h2 className="panel__title">Chcę tę rybę</h2>
      <ol className="howto small">
        <li>Zatrzymaj filmik, gdy dobrze widać wybraną rybę.</li>
        {frameGrab ? (
          <li>Kliknij „Zrób stopklatkę” pod filmikiem albo dodaj własny screenshot.</li>
        ) : (
          <li>Zrób screenshot (zrzut ekranu) i dodaj go tutaj.</li>
        )}
        <li>Stuknij w rybę, żeby zaznaczyć ją kółkiem, i wyślij zgłoszenie. Resztę ustalimy z Tobą sami.</li>
      </ol>
      {queue[0] && <FishMarker key={queue[0].id} image={queue[0].file} onDone={marked} onCancel={() => setQueue((q) => q.slice(1))} />}

      <div className="shots">
        {shots.map((s, i) => (
          <figure key={s.url} className="shot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt={`Screenshot ${i + 1}`} />
            <button type="button" className="shot__remove" aria-label={`Usuń screenshot ${i + 1}`} onClick={() => removeShot(i)}>×</button>
          </figure>
        ))}
        {free > 0 && (
          <label className="shot shot--add">
            <input ref={input} type="file" accept="image/*" multiple className="visually-hidden" onChange={(e) => addFiles(e.target.files)} />
            <span>+ Dodaj screenshot</span>
          </label>
        )}
      </div>

      <div className="two">
        <label className="field">
          Ile ryb z tego zrzutu
          <input type="number" inputMode="numeric" min={1} max={left} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(left, Number(e.target.value) || 1)))} />
        </label>
        <label className="field">
          Sekunda filmiku (opcjonalnie)
          <input id="video-second" value={form.second} onChange={set("second")} placeholder="np. 0:42" />
        </label>
      </div>
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
        <textarea id="enq-message" rows={3} value={form.message} onChange={set("message")} placeholder="np. odbiór osobisty w sobotę" />
      </label>
      <label className="visually-hidden" aria-hidden="true">
        Strona www
        <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      </label>
      {state === "error" && <p className="notice notice--error" role="alert">{error}</p>}
      <p className="muted small">Nie płacisz teraz. Po potwierdzeniu ryby podamy numer konta do przelewu, albo zapłacisz gotówką przy odbiorze.</p>
      <button type="submit" className="btn btn--primary" disabled={state === "sending"}>
        {state === "sending" ? "Wysyłanie…" : "Wyślij zgłoszenie"}
      </button>
    </form>
  );
}
