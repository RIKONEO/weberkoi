import type { Metadata } from "next";
import Link from "next/link";
import { ENQUIRY_STATUSES, type EnquiryStatus, listEnquiries } from "@/lib/data";
import { setEnquiryStatusAction } from "../../actions";
import { StatusPill } from "@/components/admin/StatusPill";

export const metadata: Metadata = { title: "Zgłoszenia" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const current = status && status in ENQUIRY_STATUSES ? (status as EnquiryStatus) : undefined;
  const rows = await listEnquiries(current);
  return (
    <div className="stack">
      <h1 className="page-title">Zgłoszenia</h1>
      <p className="muted small">Klient wysyła screenshot z filmiku z rybą, którą chce. Skontaktuj się z nim, podaj cenę i numer konta albo umów odbiór z gotówką, potem zmień status.</p>
      <div className="row">
        <Link className="chip" aria-pressed={!current} href="/admin/zapytania">Wszystkie</Link>
        {Object.entries(ENQUIRY_STATUSES).map(([k, v]) => (
          <Link key={k} className="chip" aria-pressed={current === k} href={`/admin/zapytania?status=${k}`}>{v}</Link>
        ))}
      </div>
      {rows.length ? (
        <ul className="cards">
          {rows.map(({ e, offerTitle, screenshots }) => (
            <li key={e.id} className="panel">
              <div className="admin-offer__head">
                <Link href={`/admin/oferty/${e.offerId}`}><b>{offerTitle ?? e.offerId}</b></Link>
                <StatusPill status={e.status} />
              </div>
              {screenshots.length > 0 && (
                <div className="shots">
                  {screenshots.map((id, i) => (
                    <a key={id} href={`/admin/screenshot/${id}`} target="_blank" rel="noreferrer" className="shot">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/admin/screenshot/${id}`} alt={`Screenshot ${i + 1} od ${e.name}`} loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
              <div className="small">
                {e.picks?.length ? `Ryby nr ${e.picks.join(", ")}` : `${e.qty} szt.`}
                {e.second && ` · widać ją w ${e.second}`}
              </div>
              <div className="small contact">
                <b>{e.name}</b>
                {e.phone && <a href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}>{e.phone}</a>}
                {e.email && <a href={`mailto:${e.email}`}>{e.email}</a>}
                <span className="muted">{e.createdAt.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}</span>
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
        <p className="empty">Nie ma zgłoszeń{current ? " z tym statusem" : ""}.</p>
      )}
    </div>
  );
}
