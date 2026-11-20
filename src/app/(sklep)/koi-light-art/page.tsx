import type { Metadata } from "next";
import Link from "next/link";
import { ArtCard } from "@/components/ArtCard";
import { listArtworks } from "@/lib/data";
import { ART } from "@/lib/offers";

export const metadata: Metadata = {
  title: `${ART.name}: podświetlane obrazy ze stali z motywem koi`,
  description: "Obrazy z karpiami koi wycinane laserem w stali i podświetlane od tyłu diodami LED. Ręcznie wykańczane w WEBER Nishikigoi, odbiór osobisty w Zakrzewie.",
  alternates: { canonical: ART.path },
};
export const dynamic = "force-dynamic";

export default async function ArtPage() {
  const list = await listArtworks();
  return (
    <div className="wrap section">
      <div className="art-intro">
        <div className="eyebrow">{ART.tagline}</div>
        <h1 className="page-title">{ART.name}</h1>
        <p className="muted">
          Koi, które świecą na ścianie. Każdy wzór wycinamy laserem w stalowej płycie i podświetlamy od tyłu diodami LED: w dzień to grafika
          z czarnej stali, a po zmroku ryba ożywa w ciepłym świetle. Wzory projektujemy sami, z miłości do koi, które hodujemy.
        </p>
      </div>
      {list.length ? (
        <div className="grid art-grid">
          {list.map((o) => (
            <ArtCard key={o.id} offer={o} />
          ))}
        </div>
      ) : (
        <p className="empty">Nowe obrazy już wkrótce.</p>
      )}
      <div className="steps section">
        <div>
          <h3>Wybierasz wzór</h3>
          <p className="muted">Dodaj obraz do koszyka i wyślij zgłoszenie. Możesz to zrobić razem z rybami z katalogu.</p>
        </div>
        <div>
          <h3>Potwierdzamy szczegóły</h3>
          <p className="muted">Oddzwonimy, potwierdzimy cenę, wymiar i termin. Zapłacisz przelewem albo gotówką przy odbiorze.</p>
        </div>
        <div>
          <h3>Odbierasz u nas</h3>
          <p className="muted">
            Obraz odbierasz osobiście w Zakrzewie, a my pokażemy, jak go powiesić i podłączyć. <Link href="/odbior">Jak dojechać</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
