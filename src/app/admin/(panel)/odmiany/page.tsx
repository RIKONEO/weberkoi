import type { Metadata } from "next";
import { listVarietiesWithCounts } from "@/lib/data";
import { Flash } from "@/components/admin/Flash";
import { addVarietyAction, deleteVarietyAction, moveVarietyAction, renameVarietyAction } from "../../actions";

export const metadata: Metadata = { title: "Odmiany" };

export default async function VarietiesPage({ searchParams }: { searchParams: Promise<{ zapisano?: string; blad?: string }> }) {
  const [sp, rows] = await Promise.all([searchParams, listVarietiesWithCounts()]);
  return (
    <div className="stack admin-narrow">
      <h1 className="page-title">Odmiany</h1>
      <p className="muted small">Odmiany do wyboru przy dodawaniu oferty i w filtrach katalogu, w tej samej kolejności. Odmianę można usunąć, gdy żadna oferta jej nie używa.</p>
      <Flash saved={sp.zapisano} error={sp.blad} />

      <form action={addVarietyAction} className="panel variety-add">
        <label className="field">Nowa odmiana<input name="name" required maxLength={40} placeholder="np. Shiro Utsuri" /></label>
        <button type="submit" className="btn btn--primary">Dodaj</button>
      </form>

      {rows.length ? (
        <ul className="cards">
          {rows.map((v, i) => (
            <li key={v.name} className="panel variety">
              <form action={renameVarietyAction} className="variety__name">
                <input type="hidden" name="from" value={v.name} />
                <input name="name" required maxLength={40} defaultValue={v.name} aria-label={`Nazwa odmiany ${v.name}`} />
                <button type="submit" className="btn btn--sm">Zmień nazwę</button>
              </form>
              <div className="row">
                <span className="small muted">{v.offers ? `${v.offers} ${v.offers === 1 ? "oferta" : v.offers < 5 ? "oferty" : "ofert"}` : "brak ofert"}</span>
                <form action={moveVarietyAction}>
                  <input type="hidden" name="name" value={v.name} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" className="chip" disabled={i === 0} aria-label={`Przesuń ${v.name} wyżej`}>↑</button>
                </form>
                <form action={moveVarietyAction}>
                  <input type="hidden" name="name" value={v.name} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" className="chip" disabled={i === rows.length - 1} aria-label={`Przesuń ${v.name} niżej`}>↓</button>
                </form>
                <form action={deleteVarietyAction}>
                  <input type="hidden" name="name" value={v.name} />
                  <button type="submit" className="link-btn small" disabled={v.offers > 0} title={v.offers ? "Najpierw zmień odmianę w ofertach" : undefined}>Usuń</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">Nie ma jeszcze odmian. Dodaj pierwszą powyżej.</p>
      )}
    </div>
  );
}
