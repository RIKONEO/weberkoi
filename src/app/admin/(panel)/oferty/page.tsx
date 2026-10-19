import type { Metadata } from "next";
import Link from "next/link";
import { listOffers } from "@/lib/data";
import { available, formatPLN, sizeLabel } from "@/lib/offers";
import { setOfferFlagAction } from "../../actions";

export const metadata: Metadata = { title: "Oferty" };

function Toggle({ id, flag, on, label }: { id: string; flag: "featured" | "published"; on: boolean; label: string }) {
  return (
    <form action={setOfferFlagAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="flag" value={flag} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <button type="submit" className="chip" aria-pressed={on}>{on ? `✓ ${label}` : label}</button>
    </form>
  );
}

export default async function OffersPage() {
  const rows = await listOffers({ includeHidden: true });
  return (
    <div className="stack">
      <div className="row row--between">
        <h1 className="page-title">Oferty</h1>
        <Link href="/admin/oferty/nowa" className="btn btn--primary">+ Dodaj ofertę</Link>
      </div>
      <p className="muted small">Kliknij „Edytuj”, żeby zmienić cenę, opis, filmik albo sprzedane ryby. „Wyróżniona” pokazuje ofertę na górze strony głównej.</p>
      {rows.length ? (
        <ul className="cards">
          {rows.map((o) => (
            <li key={o.id} className="panel admin-offer">
              <div className="admin-offer__head">
                <Link href={`/admin/oferty/${o.id}`}><b>{o.title}</b></Link>
                <div className="row">
                  {o.featured && <span className="pill pill--hi">Wyróżniona</span>}
                  {!o.published && <span className="pill pill--mu">Ukryta</span>}
                </div>
              </div>
              <div className="small muted">
                {sizeLabel(o)} · <span className="num">{available(o)} / {o.count}</span> dostępnych · {o.price ? formatPLN(o.price) : "zapytaj o cenę"} · {o.videoUrl ? "filmik jest" : "brak filmiku"}
              </div>
              <div className="row">
                <Link href={`/admin/oferty/${o.id}`} className="btn btn--sm">Edytuj</Link>
                <Toggle id={o.id} flag="featured" on={o.featured} label="Wyróżniona" />
                <Toggle id={o.id} flag="published" on={o.published} label="W sklepie" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">Nie ma jeszcze ofert.</p>
      )}
    </div>
  );
}
