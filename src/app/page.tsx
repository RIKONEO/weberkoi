import type { Metadata } from "next";
import Link from "next/link";
import { PondHero } from "@/components/PondHero";
import { OfferCard } from "@/components/OfferCard";
import { ArtCard } from "@/components/ArtCard";
import { listArtworks, listOffers } from "@/lib/data";
import { ART } from "@/lib/offers";
import { FAQ, GUIDE } from "@/lib/guide";

export const dynamic = "force-dynamic";
// Każda podstrona ustawia swój adres kanoniczny; ten dotyczy tylko strony głównej.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const [all, art] = await Promise.all([listOffers(), listArtworks()]);
  const featured = all.filter((o) => o.featured);
  return (
    <main>
      <PondHero />
      {featured.length > 0 && (
        <section className="wrap section">
          <div className="section__head">
            <div>
              <div className="eyebrow">Polecamy</div>
              <h2>Wyróżnione grupy</h2>
            </div>
            <Link href="/katalog" className="btn">
              Cały katalog
            </Link>
          </div>
          <div className="grid">
            {featured.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        </section>
      )}
      {art.length > 0 && (
        <section className="wrap section">
          <div className="section__head">
            <div>
              <div className="eyebrow">{ART.tagline}</div>
              <h2>{ART.name}</h2>
            </div>
            <Link href={ART.path} className="btn">
              Wszystkie obrazy
            </Link>
          </div>
          <div className="grid art-grid">
            {art.slice(0, 3).map((o) => (
              <ArtCard key={o.id} offer={o} />
            ))}
          </div>
        </section>
      )}
      <section className="wrap section">
        <div className="steps">
          <div>
            <h3>Wybierasz na filmiku</h3>
            <p className="muted">Każda oferta to filmik z całą grupą ryb. Zatrzymaj go, zrób screenshot wybranej ryby i wyślij nam w formularzu przy ofercie.</p>
          </div>
          <div>
            <h3>Potwierdzamy i ustalamy płatność</h3>
            <p className="muted">Odezwiemy się, potwierdzimy rybę i umówimy termin. Zapłacisz gotówką przy odbiorze albo wcześniej przelewem.</p>
          </div>
          <div>
            <h3>Odbierasz rybę u nas</h3>
            <p className="muted">Przyjeżdżasz do Zakrzewa w umówionym terminie, a my pakujemy rybę w worek z tlenem. Nie wysyłamy ryb kurierem.</p>
          </div>
        </div>
      </section>
      <section className="wrap section about-koi" aria-labelledby="o-koi">
        <div className="about-koi__text prose">
          <div className="eyebrow">Sklep z koi w Zakrzewie</div>
          <h2 id="o-koi">Karpie koi z Japonii i z naszej hodowli</h2>
          <p>
            W WEBER Nishikigoi sprzedajemy karpie koi do oczek i stawów ogrodowych: klasyczne Kohaku, Showa i Sanke, metaliczne Ogon
            i ufne Chagoi. Każdą grupę ryb nagrywamy na filmiku, więc wybierasz konkretną rybę i widzisz, jak pływa. Ryby odbierasz
            osobiście w Zakrzewie, bez wysyłki kurierem.
          </p>
          <p>
            <Link href={GUIDE.path}>Poradnik: jak wybrać i kupić koi</Link>
          </p>
        </div>
        <div className="faq">
          {FAQ.slice(0, 4).map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p className="muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
