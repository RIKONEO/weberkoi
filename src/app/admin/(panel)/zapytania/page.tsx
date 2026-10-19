import type { Metadata } from "next";
import Link from "next/link";
import { ENQUIRY_STATUSES, listEnquiries } from "@/lib/data";
import { setEnquiryStatusAction } from "../../actions";
import { StatusPill } from "@/components/admin/StatusPill";

export const metadata: Metadata = { title: "Zapytania o cenę" };

export default async function EnquiriesPage() {
  const rows = await listEnquiries();
  return (
    <div className="stack">
      <h1 className="page-title">Zapytania o cenę</h1>
      <p className="muted small">Odpowiedz klientowi mailem z ceną, potem oznacz zapytanie jako „Wysłano cenę”.</p>
      {rows.length ? (
        <ul className="cards">
          {rows.map(({ e, offerTitle }) => (
            <li key={e.id} className="panel">
              <div className="row row--between">
                <Link href={`/admin/oferty/${e.offerId}`}><b>{offerTitle ?? e.offerId}</b></Link>
                <StatusPill status={e.status} />
              </div>
              <div className="small">
                {e.picks?.length ? `Ryby nr ${e.picks.join(", ")}` : `${e.qty} szt. z grupy`}
                {e.second && ` · widać ją w ${e.second}`}
              </div>
              <div className="small muted">
                {e.name} · <span className="select">{e.email}</span> · {e.createdAt.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
              </div>
              {e.message && <p className="quote">{e.message}</p>}
              <div className="row">
                {Object.entries(ENQUIRY_STATUSES).filter(([k]) => k !== e.status).map(([k, v]) => (
                  <form key={k} action={setEnquiryStatusAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="status" value={k} />
                    <button type="submit" className="chip">Oznacz: {v}</button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">Nie ma jeszcze zapytań.</p>
      )}
    </div>
  );
}
