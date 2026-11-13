import type { Offer } from "@/lib/offers";
import { available } from "@/lib/offers";

/**
 * Filmik oferty. Dopóki oferta nie ma wgranego filmiku, pokazujemy zaślepkę
 * w barwach odmiany, z tymi samymi informacjami co odtwarzacz.
 */
export function OfferVideo({
  offer,
  controls = false,
  videoRef,
  crossOrigin,
  onError,
}: {
  offer: Offer;
  controls?: boolean;
  /** Na stronie oferty: dostęp do odtwarzacza, żeby zrobić stopklatkę. */
  videoRef?: React.Ref<HTMLVideoElement>;
  crossOrigin?: "anonymous";
  onError?: () => void;
}) {
  const left = available(offer);
  return (
    <div className="video" data-variety={offer.variety}>
      {offer.videoUrl ? (
        <video
          ref={videoRef}
          src={offer.videoUrl}
          crossOrigin={crossOrigin}
          onError={onError}
          poster={offer.posterUrl}
          controls={controls}
          // Filmiki w sklepie są zawsze bez dźwięku. Przycisk głośności jest ukryty w CSS,
          // a gdyby ktoś mimo to włączył dźwięk (np. skrótem lub menu), od razu go wyciszamy.
          muted
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          // Tylko na stronie oferty (komponent kliencki). Na stronie głównej i w katalogu ten
          // komponent renderuje serwer, a tam nie wolno przekazywać funkcji do <video>.
          onVolumeChange={controls ? keepMuted : undefined}
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="video__placeholder" aria-label={`Filmik: ${offer.title}`}>
          <KoiIcon />
          <span>Filmik zostanie dodany</span>
        </div>
      )}
      {/* Przy odtwarzaczu z przyciskami etykieta zasłaniałaby pasek przewijania. */}
      {!(controls && offer.videoUrl) && <span className="video__tag video__tag--play">▶ Filmik{offer.videoLength ? ` · ${offer.videoLength}` : ""}</span>}
      <span className="video__tag video__tag--count num">
        {left} z {offer.count} dostępnych
      </span>
    </div>
  );
}

function keepMuted(e: React.SyntheticEvent<HTMLVideoElement>) {
  if (!e.currentTarget.muted) e.currentTarget.muted = true;
}

function KoiIcon() {
  return (
    <svg viewBox="0 0 120 60" aria-hidden>
      <path d="M10 30c18-16 52-18 78-6 6-6 14-9 22-8-5 6-7 11-7 14s2 8 7 14c-8 1-16-2-22-8-26 12-60 10-78-6z" />
    </svg>
  );
}
