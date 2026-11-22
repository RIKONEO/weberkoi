import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { OfferPicker } from "@/components/OfferPicker";
import { getFishMap, getOffer, listMapStatuses, listTakenFish } from "@/lib/data";
import { available, formatPLN, offerPath, offerSummary, sizeLabel } from "@/lib/offers";
import { OPEN_GRAPH_BASE } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, offerSchema } from "@/lib/schema-org";
import { varietySlug } from "@/lib/varieties";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await getOffer((await params).id);
  if (!offer) return {};
  const description = offerSummary(offer);
  // „koi” w tytule pomaga przy wyszukiwaniu „koi kohaku”, „karp koi showa” itd.
  const title = /koi/i.test(offer.title) ? `${offer.title} na sprzedaż` : `Koi ${offer.title} na sprzedaż`;
  return {
    title,
    description,
    alternates: { canonical: `/oferta/${offer.id}` },
    openGraph: { ...OPEN_GRAPH_BASE, title, description, url: `/oferta/${offer.id}` },
  };
}

export default async function OfferPage({ params }: Props) {
  const offer = await getOffer((await params).id);
  if (!offer) notFound();
  // Obrazy z metalu mają własną stronę w dziale Koi Art.
  if (offer.kind !== "ryba") permanentRedirect(offerPath(offer));
  const [taken, map, statuses] = await Promise.all([listTakenFish(offer.id), getFishMap(offer.id), listMapStatuses(offer)]);
  return (
    <div className="wrap section">
      <JsonLd data={offerSchema(offer)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Katalog koi", path: "/katalog" },
          { name: `Koi ${offer.variety}`, path: `/odmiany/${varietySlug(offer.variety)}` },
          { name: offer.title, path: `/oferta/${offer.id}` },
        ])}
      />
      <Link href="/katalog" className="back">← Wróć do katalogu</Link>
      <OfferPicker
        offer={offer}
        taken={taken}
        map={map}
        statuses={statuses}
        details={
          <>
            <div>
              <div className="eyebrow">{offer.featured && <span className="pill pill--hi">Polecamy</span>} {offer.breeder}</div>
              <h1 className="page-title">{offer.title}</h1>
            </div>
            <p className="muted">{offer.description}</p>
            <dl className="specs">
              <dt>Odmiana</dt><dd><Link href={`/odmiany/${varietySlug(offer.variety)}`}>{offer.variety}</Link></dd>
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
