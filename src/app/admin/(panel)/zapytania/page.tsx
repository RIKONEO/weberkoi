import type { Metadata } from "next";
import Link from "next/link";
import { ENQUIRY_STATUSES, FISH_STATES, type EnquiryStatus, listEnquiries } from "@/lib/data";
import { deleteEnquiryAction, setEnquiryFishAction, setEnquiryStatusAction } from "../../actions";
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
      <p className="muted small">Ryba z nowego zgłoszenia od razu pokazuje się pod filmikiem jako <b>zarezerwowana</b>. Po sprzedaży kliknij „Sprzedana”, a jeśli klient zrezygnuje albo zdjęcie nie nadaje się do pokazania, kliknij „Wolna”: zniknie ze strony.</p>
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
              <div className="fish-row">
                <span className="small">Ryba: <FishPill fish={e.fish} /></span>
                {Object.entries(FISH_STATES).filter(([k]) => k !== e.fish).map(([k, v]) => (
                  <form key={k} action={setEnquiryFishAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="offerId" value={e.offerId} />
                    <input type="hidden" name="fish" value={k} />
                    <button type="submit" className={k === "sprzedana" ? "btn btn--primary btn--sm" : "chip"}>
                      {k === "wolna" ? "Wolna (ukryj ze strony)" : v}
                    </button>
                  </form>
                ))}
              </div>
              <div className="row">
                {Object.entries(ENQUIRY_STATUSES).filter(([k]) => k !== e.status).map(([k, v]) => (
                  <form key={k} action={setEnquiryStatusAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="status" value={k} />
                    <button type="submit" className="chip">Oznacz: {v}</button>
                  </form>
                ))}
              </div>
              <details className="small">
                <summary className="muted">Usuń zgłoszenie (np. na prośbę klienta)</summary>
                <form action={deleteEnquiryAction} className="row">
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="offerId" value={e.offerId} />
                  <span className="muted">Znikną dane klienta i stopklatki, także spod filmiku. Tego nie da się cofnąć.</span>
                  <button type="submit" className="btn btn--sm">Tak, usuń na zawsze</button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">Nie ma zgłoszeń{current ? " z tym statusem" : ""}.</p>
      )}
    </div>
  );
}

const FISH_TONE: Record<string, string> = { zarezerwowana: "warn", sprzedana: "hi", wolna: "mu" };
const FISH_LABELS: Record<string, string> = FISH_STATES;

function FishPill({ fish }: { fish: string }) {
  return <span className={`pill pill--${FISH_TONE[fish] ?? "mu"}`}>{FISH_LABELS[fish] ?? fish}</span>;
}
