"use client";

import { useRef, useState } from "react";

const MAX_SIDE = 2000;

/** Zmniejsza zdjęcie z telefonu przed wysłaniem (Vercel przyjmuje najwyżej ok. 4,5 MB naraz). */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.86));
    return out ?? file;
  } catch {
    return file;
  }
}

/**
 * Zdjęcia obrazu w formularzu panelu: wgrywanie (także kilku naraz z telefonu), kolejność i usuwanie.
 * Pierwsze zdjęcie jest główne (kafelek w sklepie, koszyk, mail). Lista idzie do formularza jako JSON.
 */
export function PhotosField({ initial, offerId, max }: { initial: string[]; offerId?: string; max: number }) {
  const [photos, setPhotos] = useState(initial);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const list = [...files].slice(0, Math.max(0, max - photos.length));
    if (list.length < files.length) setError(`Obraz może mieć najwyżej ${max} zdjęć.`);
    setBusy(list.length);
    for (const file of list) {
      try {
        const body = new FormData();
        body.set("photo", await shrink(file), "zdjecie.jpg");
        if (offerId) body.set("offerId", offerId);
        const res = await fetch("/admin/zdjecia", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error ?? `Błąd ${res.status}`);
        setPhotos((cur) => [...cur, data.url]);
      } catch (err) {
        setError(`Nie udało się wgrać zdjęcia: ${err instanceof Error ? err.message : "spróbuj jeszcze raz"}.`);
      }
      setBusy((n) => n - 1);
    }
    if (input.current) input.current.value = "";
  }

  const move = (i: number, d: -1 | 1) =>
    setPhotos((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <fieldset className="photos-field">
      <legend>Zdjęcia</legend>
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />
      {photos.length > 0 ? (
        <ul className="photos-field__list">
          {photos.map((p, i) => (
            <li key={p} className="photos-field__item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`Zdjęcie ${i + 1}`} />
              {i === 0 && <span className="pill pill--hi photos-field__main">Główne</span>}
              <div className="photos-field__actions">
                <button type="button" className="chip" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Przesuń w lewo">◀</button>
                <button type="button" className="chip" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label="Przesuń w prawo">▶</button>
                <button type="button" className="chip" onClick={() => setPhotos((cur) => cur.filter((x) => x !== p))}>Usuń</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">Nie ma jeszcze zdjęć. Bez zdjęcia obraz nie trafi do koszyka.</p>
      )}
      {photos.length < max && (
        <label className="btn">
          {busy ? `Wgrywam… (${busy})` : "+ Dodaj zdjęcia"}
          <input ref={input} type="file" accept="image/*" multiple hidden disabled={busy > 0} onChange={(e) => upload(e.target.files)} />
        </label>
      )}
      {error && <p className="notice notice--error small" role="alert">{error}</p>}
      <p className="muted small">Pierwsze zdjęcie jest główne: widać je w sklepie, w koszyku i w mailu. Najlepiej wychodzą zdjęcia po zmroku, z włączonym podświetleniem. Zmiany zdjęć zapisują się po kliknięciu „Zapisz”.</p>
    </fieldset>
  );
}
