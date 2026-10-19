import Link from "next/link";
import { PondHero } from "@/components/PondHero";
import { OfferCard } from "@/components/OfferCard";
import { listOffers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const latest = (await listOffers()).slice(0, 3);
  return (
    <main>
      <PondHero />
      <section className="wrap section">
        <div className="section__head">
          <div>
            <div className="eyebrow">Nowe w stawie</div>
            <h2>Ostatnio dodane grupy</h2>
          </div>
          <Link href="/katalog" className="btn">
            Cały katalog
          </Link>
        </div>
        <div className="grid">
          {latest.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </div>
      </section>
      <section className="wrap section">
        <div className="steps">
          <div>
            <h3>Wybierasz na filmiku</h3>
            <p className="muted">Każda oferta to filmik z całą grupą ryb. Ryby mają numery, więc możesz wskazać konkretną albo kupić sztukę z grupy.</p>
          </div>
          <div>
            <h3>Płacisz online</h3>
            <p className="muted">BLIK, karta albo szybki przelew. Przy odbiorze osobistym możesz też zapłacić na miejscu.</p>
          </div>
          <div>
            <h3>Odbierasz albo czekasz na kuriera</h3>
            <p className="muted">Wysyłamy w poniedziałki, wtorki i środy, w workach z tlenem i kartonach termicznych.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
