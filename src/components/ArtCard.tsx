import Link from "next/link";
import { type Offer, available, formatPLN, offerPath } from "@/lib/offers";

/** Kafelek obrazu z metalu (dział Koi Light Art): zdjęcie zamiast filmiku. */
export function ArtCard({ offer }: { offer: Offer }) {
  const soldOut = available(offer) === 0;
  return (
    <Link href={offerPath(offer)} className={offer.featured ? "tile tile--featured art-tile" : "tile art-tile"}>
      <div className="tile__media art-tile__media">
        {offer.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offer.photos[0]} alt={`Obraz ze stali z motywem koi: ${offer.title}`} loading="lazy" />
        ) : (
          <span className="muted small">Zdjęcie wkrótce</span>
        )}
        {offer.featured && <span className="tile__badge">Polecamy</span>}
        {soldOut && <span className="tile__badge tile__badge--mu">Wyprzedany</span>}
      </div>
      <div className="tile__meta">
        <h3>{offer.title}</h3>
        {offer.price ? <span className="price num">{formatPLN(offer.price)}</span> : <span className="price price--ask">Cena na zapytanie</span>}
      </div>
      <div className="muted small">{["Stal cięta laserem", offer.dimensions].filter(Boolean).join(" · ")}</div>
    </Link>
  );
}
