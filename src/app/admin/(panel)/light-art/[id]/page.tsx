import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOffer } from "@/lib/data";
import { ART, offerPath } from "@/lib/offers";
import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { Flash } from "@/components/admin/Flash";
import { deleteArtworkAction } from "../../../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapisano?: string; blad?: string }> };

export const metadata: Metadata = { title: "Edycja obrazu" };

export default async function EditArtworkPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const offer = await getOffer(id, { includeHidden: true });
  if (!offer) notFound();
  if (offer.kind !== "obraz") redirect(`/admin/oferty/${offer.id}`);
  return (
    <div className="stack admin-narrow">
      <Link href="/admin/light-art" className="back">← {ART.name}</Link>
      <div className="row row--between">
        <h1 className="page-title">{offer.title}</h1>
        {offer.published && <Link href={offerPath(offer)} target="_blank" className="btn">Zobacz w sklepie ↗</Link>}
      </div>
      <Flash saved={sp.zapisano} error={sp.blad} />
      <ArtworkForm offer={offer} />
      <form action={deleteArtworkAction} className="row">
        <input type="hidden" name="id" value={offer.id} />
        <button type="submit" className="link-btn small">Usuń obraz</button>
        <span className="muted small">Usuwa też zgłoszenia z tym obrazem. Jeśli chcesz tylko schować obraz, odznacz „Widoczny w sklepie”.</span>
      </form>
    </div>
  );
}
