"use client";

import { useState } from "react";

/** Zdjęcia obrazu: duże główne i miniatury pod spodem (gdy jest ich więcej niż jedno). */
export function ArtGallery({ photos, title }: { photos: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) return <div className="art-gallery__main art-gallery__main--empty muted">Zdjęcie wkrótce</div>;
  const cur = photos[Math.min(i, photos.length - 1)];
  return (
    <div className="art-gallery">
      <a href={cur} target="_blank" rel="noreferrer" className="art-gallery__main" aria-label="Otwórz zdjęcie w pełnym rozmiarze">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur} alt={`${title}: podświetlany obraz ze stali`} />
      </a>
      {photos.length > 1 && (
        <div className="art-gallery__thumbs">
          {photos.map((p, n) => (
            <button key={p} type="button" className="art-gallery__thumb" aria-pressed={n === i} onClick={() => setI(n)} aria-label={`Zdjęcie ${n + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
