import type { Metadata } from "next";
import Link from "next/link";
import { OfferForm } from "@/components/admin/OfferForm";
import { Flash } from "@/components/admin/Flash";

export const metadata: Metadata = { title: "Nowa oferta" };

export default async function NewOfferPage({ searchParams }: { searchParams: Promise<{ blad?: string }> }) {
  const { blad } = await searchParams;
  return (
    <div className="stack admin-narrow">
      <Link href="/admin/oferty" className="back">← Oferty</Link>
      <h1 className="page-title">Nowa oferta</h1>
      <Flash error={blad} />
      <OfferForm />
    </div>
  );
}
