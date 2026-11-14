import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFishMap, getOffer, listMapStatuses, listVarieties } from "@/lib/data";
import { FishMapEditor } from "@/components/admin/FishMapEditor";
import { OfferForm } from "@/components/admin/OfferForm";
import { Flash } from "@/components/admin/Flash";
import { deleteOfferAction } from "../../../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapisano?: string; blad?: string; nowa?: string }> };

export const metadata: Metadata = { title: "Edycja oferty" };

export default async function EditOfferPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [offer, varieties] = await Promise.all([getOffer(id, { includeHidden: true }), listVarieties()]);
  if (!offer) notFound();
  const [map, statuses] = await Promise.all([getFishMap(offer.id, { includeHidden: true }), listMapStatuses(offer)]);
  return (
    <div className="stack admin-narrow">
      <Link href="/admin/oferty" className="back">← Oferty</Link>
      <div className="row row--between">
        <h1 className="page-title">{offer.title}</h1>
        <div className="row">
          <a href="#mapa" className="btn">Mapa ryb ↓</a>
          {offer.published && <Link href={`/oferta/${offer.id}`} target="_blank" className="btn">Zobacz w sklepie ↗</Link>}
        </div>
      </div>
      <Flash saved={sp.zapisano} error={sp.blad} />
      <OfferForm offer={offer} varieties={varieties} />
      <FishMapEditor offerId={offer.id} videoUrl={offer.videoUrl} initial={map} statuses={statuses} count={offer.count} sold={offer.sold} scrollIntoView={sp.nowa === "1"} />
      <form action={deleteOfferAction} className="row">
        <input type="hidden" name="id" value={offer.id} />
        <button type="submit" className="link-btn small">Usuń ofertę</button>
        <span className="muted small">Ofertę z dawnymi zamówieniami ze sklepu można tylko ukryć.</span>
      </form>
    </div>
  );
}
