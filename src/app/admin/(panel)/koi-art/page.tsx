import type { Metadata } from "next";
import Link from "next/link";
import { listArtworks } from "@/lib/data";
import { ART, available, formatPLN } from "@/lib/offers";
import { setOfferFlagAction } from "../../actions";

export const metadata: Metadata = { title: ART.name };

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

export default async function ArtAdminPage() {
  const rows = await listArtworks({ includeHidden: true });
  return (
    <div className="stack">
      <div className="row row--between">
        <h1 className="page-title">{ART.name}</h1>
        <Link href="/admin/koi-art/nowy" className="btn btn--primary">+ Dodaj obraz</Link>
      </div>
      <p className="muted small">{ART.tagline}. Klient dodaje obraz do koszyka (także razem z rybami) i wysyła zwykłe zgłoszenie, które trafia do „Zgłoszeń”. Kliknij „Edytuj”, żeby ustawić cenę, wymiary, opis i zdjęcia.</p>
      {rows.length ? (
        <ul className="cards">
          {rows.map((o) => (
            <li key={o.id} className="panel admin-offer admin-art">
              {o.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.photos[0]} alt="" className="admin-art__thumb" />
              )}
              <div className="stack">
                <div className="admin-offer__head">
                  <Link href={`/admin/koi-art/${o.id}`}><b>{o.title}</b></Link>
                  <div className="row">
                    {o.featured && <span className="pill pill--hi">Wyróżniony</span>}
                    {!o.published && <span className="pill pill--mu">Ukryty</span>}
                  </div>
                </div>
                <div className="small muted">
                  {o.price ? formatPLN(o.price) : <span className="warn-text">cena na zapytanie</span>} · {o.dimensions || <span className="warn-text">brak wymiarów</span>} ·{" "}
                  <span className="num">{available(o)} / {o.count}</span> do sprzedania · {o.photos.length} {o.photos.length === 1 ? "zdjęcie" : "zdjęć"}
                </div>
                <div className="row">
                  <Link href={`/admin/koi-art/${o.id}`} className="btn btn--sm">Edytuj</Link>
                  <Toggle id={o.id} flag="featured" on={o.featured} label="Wyróżniony" />
                  <Toggle id={o.id} flag="published" on={o.published} label="W sklepie" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">Nie ma jeszcze obrazów.</p>
      )}
    </div>
  );
}
