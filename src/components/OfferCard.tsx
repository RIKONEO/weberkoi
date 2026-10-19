import Link from "next/link";
import { type Offer, formatPLN, sizeLabel } from "@/lib/offers";
import { OfferVideo } from "./OfferVideo";

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Link href={`/oferta/${offer.id}`} className={offer.featured ? "tile tile--featured" : "tile"}>
      <div className="tile__media">
        <OfferVideo offer={offer} />
        {offer.featured && <span className="tile__badge">Polecamy</span>}
      </div>
      <div className="tile__meta">
        <h3>{offer.variety}</h3>
        {offer.price ? (
          <span className="price num">
            {formatPLN(offer.price)} <span className="muted small">/ szt.</span>
          </span>
        ) : (
          <span className="price price--ask">Zapytaj o cenę</span>
        )}
      </div>
      <div className="muted small">
        {sizeLabel(offer)} · {offer.age} · {offer.breeder}
      </div>
    </Link>
  );
}
