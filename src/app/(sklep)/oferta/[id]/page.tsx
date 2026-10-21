import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OfferPicker } from "@/components/OfferPicker";
import { getOffer } from "@/lib/data";
import { available, formatPLN, sizeLabel } from "@/lib/offers";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await getOffer((await params).id);
  return offer ? { title: offer.title, description: offer.description } : {};
}

export default async function OfferPage({ params }: Props) {
  const offer = await getOffer((await params).id);
  if (!offer) notFound();
  return (
    <div className="wrap section">
      <Link href="/katalog" className="back">← Wróć do katalogu</Link>
      <OfferPicker
        offer={offer}
        details={
          <>
            <div>
              <div className="eyebrow">{offer.featured && <span className="pill pill--hi">Polecamy</span>} {offer.breeder}</div>
              <h1 className="page-title">{offer.title}</h1>
            </div>
            <p className="muted">{offer.description}</p>
            <dl className="specs">
              <dt>Odmiana</dt><dd>{offer.variety}</dd>
              <dt>Rozmiar</dt><dd>{sizeLabel(offer)}</dd>
              <dt>Wiek</dt><dd>{offer.age}</dd>
              <dt>W grupie</dt><dd className="num">{offer.count} ryb, {available(offer)} dostępnych</dd>
              <dt>Cena</dt><dd>{offer.price ? <><span className="num">{formatPLN(offer.price)}</span> za sztukę</> : "ustalana indywidualnie"}</dd>
            </dl>
          </>
        }
      />
    </div>
  );
}
