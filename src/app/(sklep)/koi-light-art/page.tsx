import type { Metadata } from "next";
import Link from "next/link";
import { ArtCard } from "@/components/ArtCard";
import { listArtworks } from "@/lib/data";
import { ART } from "@/lib/offers";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: `${ART.name}: obrazy ze stali z motywem koi, cięte laserem`,
  description: "Obrazy z karpiami koi wycinane laserem w stali, każdy wzór w wybranym wymiarze do 2 × 2 m. WEBER Nishikigoi, odbiór osobisty w Zakrzewie.",
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
          Koi wycięte laserem w stalowej płycie, do powieszenia na ścianie. Na zdjęciach za obrazem jest lampa, żeby było widać
          każdy detal. Sam obraz sprzedajemy bez podświetlenia, więc możesz go powiesić na jasnej ścianie albo dodać własne światło.
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
      <section id="wymiar" className="panel art-custom section">
        <div className="eyebrow">Na wymiar</div>
        <h2>Nasz wzór, Twój wymiar</h2>
        <p className="muted">
          Każdy z naszych wzorów wytniemy w rozmiarze dopasowanym do Twojej ściany, do <b>2 × 2 m</b>. Wybierz wzór, podaj wymiar,
          a wycenimy wycinkę. Wycinamy tylko nasze wzory, nie robimy cudzych projektów.
        </p>
        <div className="row">
          <a href={CONTACT.phoneHref} className="btn btn--primary">Zadzwoń: {CONTACT.phone}</a>
          <a href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(`${ART.name}: wzór na wymiar`)}`} className="btn">Napisz maila</a>
        </div>
      </section>
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
            Obraz odbierasz osobiście w Zakrzewie, a my podpowiemy, jak go powiesić. <Link href="/odbior">Jak dojechać</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
