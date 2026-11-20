import type { Metadata } from "next";
import Link from "next/link";
import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { Flash } from "@/components/admin/Flash";

export const metadata: Metadata = { title: "Nowy obraz" };

export default async function NewArtworkPage({ searchParams }: { searchParams: Promise<{ blad?: string }> }) {
  const { blad } = await searchParams;
  return (
    <div className="stack admin-narrow">
      <Link href="/admin/light-art" className="back">← Koi Light Art</Link>
      <h1 className="page-title">Nowy obraz</h1>
      <Flash error={blad} />
      <ArtworkForm />
    </div>
  );
}
