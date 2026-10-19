import type { Offer } from "@/lib/offers";
import { available } from "@/lib/offers";

/**
 * Filmik oferty. Dopóki oferta nie ma wgranego filmiku, pokazujemy zaślepkę
 * w barwach odmiany, z tymi samymi informacjami co odtwarzacz.
 */
export function OfferVideo({ offer, controls = false, compact = false }: { offer: Offer; controls?: boolean; compact?: boolean }) {
  const left = available(offer);
  return (
    <div className={compact ? "video video--compact" : "video"} data-variety={offer.variety}>
      {offer.videoUrl ? (
        <video
          src={offer.videoUrl}
          poster={offer.posterUrl}
          controls={controls}
          muted={!controls}
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="video__placeholder" aria-label={`Filmik: ${offer.title}`}>
          <svg viewBox="0 0 120 60" aria-hidden>
            <path d="M10 30c18-16 52-18 78-6 6-6 14-9 22-8-5 6-7 11-7 14s2 8 7 14c-8 1-16-2-22-8-26 12-60 10-78-6z" />
          </svg>
          {!compact && <span>Filmik zostanie dodany</span>}
        </div>
      )}
      {!compact && (
        <>
          <span className="video__tag video__tag--play">▶ Filmik{offer.videoLength ? ` · ${offer.videoLength}` : ""}</span>
          <span className="video__tag video__tag--count num">
            {left} z {offer.count} dostępnych
          </span>
        </>
      )}
    </div>
  );
}
