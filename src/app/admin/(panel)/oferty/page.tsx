import type { Metadata } from "next";
import Link from "next/link";
import { listOffers } from "@/lib/data";
import { available, formatPLN, sizeLabel } from "@/lib/offers";

export const metadata: Metadata = { title: "Oferty" };

export default async function OffersPage() {
  const rows = await listOffers({ includeHidden: true });
  return (
    <div className="stack">
      <div className="row row--between">
        <h1 className="page-title">Oferty</h1>
        <Link href="/admin/oferty/nowa" className="btn btn--primary">+ Dodaj ofertę</Link>
      </div>
      <div className="tscroll">
        <table>
          <thead><tr><th>Oferta</th><th>Rozmiar</th><th className="r">Dostępne</th><th>Cena</th><th>Filmik</th><th>W sklepie</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/oferty/${o.id}`}>{o.title}</Link></td>
                <td>{sizeLabel(o)}</td>
                <td className="r num">{available(o)} / {o.count}</td>
                <td>{o.price ? formatPLN(o.price) : <span className="pill pill--warn">Zapytaj</span>}</td>
                <td>{o.videoUrl ? <span className="pill pill--ok">Jest</span> : <span className="pill pill--mu">Brak</span>}</td>
                <td>{o.published ? "Tak" : <span className="pill pill--mu">Ukryta</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
