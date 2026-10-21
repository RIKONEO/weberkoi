"use client";

import { useEffect, useMemo, useState } from "react";

type Mark = { x: number; y: number };

/** Kółko wokół ryby, rysowane na obrazku przed wysłaniem. Rozmiar jako ułamek krótszego boku zdjęcia. */
const SIZES = [
  { id: "s", label: "Małe", r: 0.06 },
  { id: "m", label: "Średnie", r: 0.1 },
  { id: "l", label: "Duże", r: 0.16 },
];

async function drawMark(image: Blob, mark: Mark, r: number): Promise<Blob> {
  const bmp = await createImageBitmap(image);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const side = Math.min(canvas.width, canvas.height);
  const radius = r * side;
  const line = Math.max(3, side * 0.008);
  ctx.beginPath();
  ctx.arc(mark.x * canvas.width, mark.y * canvas.height, radius, 0, Math.PI * 2);
  // Ciemna obwódka pod żółtym kółkiem, żeby było widać je i na białej, i na czerwonej rybie.
  ctx.lineWidth = line * 2.2;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.65)";
  ctx.stroke();
  ctx.lineWidth = line;
  ctx.strokeStyle = "#ffd60a";
  ctx.stroke();
  const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.88));
  return out ?? image;
}

/**
 * Okno, w którym klient stuka w rybę na stopklatce albo screenshocie. Kółko zostaje narysowane
 * na obrazku, więc w panelu od razu widać, o którą rybę chodzi.
 */
export function FishMarker({ image, onDone, onCancel }: { image: Blob; onDone: (marked: Blob) => void; onCancel: () => void }) {
  const url = useMemo(() => URL.createObjectURL(image), [image]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  const [mark, setMark] = useState<Mark | null>(null);
  const [size, setSize] = useState(SIZES[1]);
  const [ratio, setRatio] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function place(e: React.PointerEvent<HTMLImageElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    setMark({ x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height });
  }

  async function finish(withMark: boolean) {
    setBusy(true);
    onDone(withMark && mark ? await drawMark(image, mark, size.r) : image);
  }

  // Średnica kółka w procentach szerokości obrazka, liczona od krótszego boku.
  const diameter = 2 * size.r * Math.min(1, 1 / ratio) * 100;

  return (
    <div className="marker" role="dialog" aria-modal="true" aria-labelledby="marker-title">
      <div className="marker__box">
        <h2 id="marker-title" className="marker__title">Stuknij w rybę, którą chcesz</h2>
        <div className="marker__stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Stopklatka z filmiku"
            draggable={false}
            onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || 1)}
            onPointerDown={place}
          />
          {mark && (
            <span
              className="marker__ring"
              style={{ left: `${mark.x * 100}%`, top: `${mark.y * 100}%`, width: `${diameter}%` }}
              aria-hidden
            />
          )}
        </div>
        <div className="marker__sizes" role="group" aria-label="Wielkość kółka">
          <span className="muted small">Kółko:</span>
          {SIZES.map((s) => (
            <button key={s.id} type="button" className="chip" aria-pressed={s.id === size.id} onClick={() => setSize(s)}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="muted small">{mark ? "Nie ta ryba? Stuknij jeszcze raz w inne miejsce." : "Zaznaczymy ją kółkiem, żebyśmy wiedzieli, o którą chodzi."}</p>
        <div className="marker__actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Anuluj
          </button>
          <button type="button" className="btn" onClick={() => finish(false)} disabled={busy}>
            Dodaj bez kółka
          </button>
          <button type="button" className="btn btn--primary" onClick={() => finish(true)} disabled={busy || !mark}>
            Dodaj do zgłoszenia
          </button>
        </div>
      </div>
    </div>
  );
}
