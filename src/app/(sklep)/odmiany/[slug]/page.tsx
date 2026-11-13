import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OfferCard } from "@/components/OfferCard";
import { listOffers, listVarieties } from "@/lib/data";
import { varietyInfo, varietySlug } from "@/lib/varieties";
import { OPEN_GRAPH_BASE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

async function findVariety(slug: string) {
  return (await listVarieties()).find((v) => varietySlug(v) === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = await findVariety((await params).slug);
  if (!name) return {};
  const title = `Koi ${name} na sprzedaż`;
  const description = `${varietyInfo(name)} Każda ryba na filmiku, odbiór osobisty w Zakrzewie.`;
  const url = `/odmiany/${varietySlug(name)}`;
  return { title, description, alternates: { canonical: url }, openGraph: { ...OPEN_GRAPH_BASE, title, description, url } };
}

export default async function VarietyPage({ params }: Props) {
  const name = await findVariety((await params).slug);
  if (!name) notFound();
  const offers = (await listOffers()).filter((o) => o.variety === name);
  return (
    <div className="wrap section">
      <Link href="/katalog" className="back">← Cały katalog</Link>
      <div className="eyebrow">Odmiana</div>
      <h1 className="page-title">Koi {name}</h1>
      <p className="muted" style={{ maxWidth: "62ch", margin: "8px 0 28px" }}>{varietyInfo(name)}</p>
      {offers.length ? (
        <div className="grid">
          {offers.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </div>
      ) : (
        <p className="empty">
          Teraz nie mamy ryb tej odmiany na sprzedaż. Zadzwoń albo napisz, damy znać, gdy się pojawią. <Link href="/katalog">Zobacz inne koi</Link>
        </p>
      )}
    </div>
  );
}
