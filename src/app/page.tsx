import Link from "next/link";
import { PondHero } from "@/components/PondHero";
import { OfferCard } from "@/components/OfferCard";
import { listOffers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const all = await listOffers();
  const featured = all.filter((o) => o.featured);
  const latest = all.filter((o) => !o.featured).sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 3);
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
          </div>
          <div className="grid">
            {featured.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        </section>
      )}
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
            <p className="muted">Każda oferta to filmik z całą grupą ryb. Zatrzymaj go, zrób screenshot wybranej ryby i wyślij nam w formularzu przy ofercie.</p>
          </div>
          <div>
            <h3>Potwierdzamy i ustalamy płatność</h3>
            <p className="muted">Odezwiemy się, potwierdzimy rybę i podamy numer konta do przelewu. Przy odbiorze osobistym możesz zapłacić gotówką.</p>
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
