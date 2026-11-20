import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getOffer } from "@/lib/data";
import { ART, artworkSummary, available, formatPLN } from "@/lib/offers";
import { OPEN_GRAPH_BASE } from "@/lib/site";
import { CONTACT } from "@/lib/contact";
import { ArtGallery } from "@/components/ArtGallery";
import { AddArtToCart } from "@/components/AddArtToCart";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await getOffer((await params).id);
  if (!offer || offer.kind !== "obraz") return {};
  const description = artworkSummary(offer);
  const url = `${ART.path}/${offer.id}`;
  return {
    title: `${offer.title}: obraz z koi ze stali cięty laserem`,
    description,
    alternates: { canonical: url },
    openGraph: { ...OPEN_GRAPH_BASE, title: `${offer.title} · ${ART.name}`, description, url, images: offer.photos[0] ? [offer.photos[0]] : undefined },
  };
}

export default async function ArtworkPage({ params }: Props) {
  const offer = await getOffer((await params).id);
  if (!offer) notFound();
  if (offer.kind !== "obraz") permanentRedirect(`/oferta/${offer.id}`);
  const left = available(offer);
  return (
    <div className="wrap section">
      <Link href={ART.path} className="back">← Wszystkie obrazy {ART.name}</Link>
      <div className="offer art">
        <ArtGallery photos={offer.photos} title={offer.title} />
        <div className="stack">
          <div>
            <div className="eyebrow">{offer.featured && <span className="pill pill--hi">Polecamy</span>} {ART.name}</div>
            <h1 className="page-title">{offer.title}</h1>
          </div>
          {offer.description && <p className="muted art__desc">{offer.description}</p>}
          <dl className="specs">
            <dt>Materiał</dt><dd>Stal cięta laserem</dd>
            <dt>Wykonanie</dt><dd>Bez podświetlenia. Na zdjęciach światło jest za obrazem, żeby było widać wzór.</dd>
            {offer.dimensions && <><dt>Wymiary</dt><dd>{offer.dimensions}</dd></>}
            <dt>Cena</dt><dd>{offer.price ? <span className="num">{formatPLN(offer.price)}</span> : "na zapytanie"}</dd>
            <dt>Odbiór</dt><dd>Osobisty w Zakrzewie</dd>
          </dl>
          <AddArtToCart offerId={offer.id} title={offer.title} price={offer.price} photo={offer.photos[0]} soldOut={left === 0} />
          <p className="muted small">
            Chcesz inny rozmiar albo własny wzór? Wytniemy go na wymiar, do 2 × 2 m. <Link href={`${ART.path}#wlasny-wzor`}>Zobacz, jak to działa</Link>.
          </p>
          <p className="muted small">
            Nie płacisz teraz. Po zgłoszeniu {CONTACT.person} oddzwoni, potwierdzi cenę i termin odbioru. Pytania? Zadzwoń:{" "}
            <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
