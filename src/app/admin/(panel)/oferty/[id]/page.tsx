import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOffer, listVarieties } from "@/lib/data";
import { OfferForm } from "@/components/admin/OfferForm";
import { Flash } from "@/components/admin/Flash";
import { deleteOfferAction } from "../../../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapisano?: string; blad?: string }> };

export const metadata: Metadata = { title: "Edycja oferty" };

export default async function EditOfferPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [offer, varieties] = await Promise.all([getOffer(id, { includeHidden: true }), listVarieties()]);
  if (!offer) notFound();
  return (
    <div className="stack admin-narrow">
      <Link href="/admin/oferty" className="back">← Oferty</Link>
      <div className="row row--between">
        <h1 className="page-title">{offer.title}</h1>
        {offer.published && <Link href={`/oferta/${offer.id}`} target="_blank" className="btn">Zobacz w sklepie ↗</Link>}
      </div>
      <Flash saved={sp.zapisano} error={sp.blad} />
      <OfferForm offer={offer} varieties={varieties} />
      <form action={deleteOfferAction} className="row">
        <input type="hidden" name="id" value={offer.id} />
        <button type="submit" className="link-btn small">Usuń ofertę</button>
        <span className="muted small">Ofertę z dawnymi zamówieniami ze sklepu można tylko ukryć.</span>
      </form>
    </div>
  );
}
