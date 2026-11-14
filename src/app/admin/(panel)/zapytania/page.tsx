import type { Metadata } from "next";
import Link from "next/link";
import { ENQUIRY_STATUSES, FISH_STATES, type EnquiryStatus, listRequests } from "@/lib/data";
import { formatPLN, plural } from "@/lib/offers";
import { deleteEnquiryAction, setEnquiryFishAction, setEnquiryStatusAction } from "../../actions";
import { StatusPill } from "@/components/admin/StatusPill";
import { Flash } from "@/components/admin/Flash";

export const metadata: Metadata = { title: "Zgłoszenia" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string; blad?: string }> }) {
  const { status, blad } = await searchParams;
  const current = status && status in ENQUIRY_STATUSES ? (status as EnquiryStatus) : undefined;
  const rows = await listRequests(current);
  return (
    <div className="stack">
      <h1 className="page-title">Zgłoszenia</h1>
      <Flash error={blad} />
      <p className="muted small">Klient zbiera w koszyku ryby ze stopklatek (z jednego albo kilku filmików) i wysyła je w jednym zgłoszeniu. Skontaktuj się z nim, podaj cenę i numer konta albo umów odbiór z gotówką, potem zmień status.</p>
      <p className="muted small">Ryba z nowego zgłoszenia od razu pokazuje się pod filmikiem jako <b>zarezerwowana</b>. Ryba wybrana z mapy pod filmikiem robi się na mapie żółta, po „Sprzedana” szara, a po „Wolna” znowu zielona. Stan ustawiasz osobno dla każdej ryby: po sprzedaży kliknij „Sprzedana”, a jeśli klient zrezygnuje albo zdjęcie nie nadaje się do pokazania, kliknij „Wolna”: zniknie ze strony.</p>
      <div className="row">
        <Link className="chip" aria-pressed={!current} href="/admin/zapytania">Wszystkie</Link>
        {Object.entries(ENQUIRY_STATUSES).map(([k, v]) => (
          <Link key={k} className="chip" aria-pressed={current === k} href={`/admin/zapytania?status=${k}`}>{v}</Link>
        ))}
      </div>
      {rows.length ? (
        <ul className="cards">
          {rows.map(({ key, first: e, items }) => {
            const fish = items.reduce((s, it) => s + it.e.qty, 0);
            const total = items.reduce((s, it) => s + (it.price ?? 0) * it.e.qty, 0);
            const unpriced = items.some((it) => !it.price);
            return (
              <li key={key} id={`z${e.id}`} className="panel">
                <div className="admin-offer__head">
                  <div className="small contact">
                    <b>{e.name}</b>
                    {e.phone && <a href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}>{e.phone}</a>}
                    {e.email && <a href={`mailto:${e.email}`}>{e.email}</a>}
                    <span className="muted">{e.createdAt.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Warsaw" })}</span>
                  </div>
                  <StatusPill status={e.status} />
                </div>
                {items.length > 1 && (
                  <div className="small">
                    <b>{fish} {plural(fish, "ryba", "ryby", "ryb")} w jednym zgłoszeniu</b>
                    {total > 0 && <> · razem ok. {formatPLN(total)}{unpriced && " + ryby z ceną do ustalenia"}</>}
                  </div>
                )}
                {e.message && <p className="quote">{e.message}</p>}
                <ul className="enq-items">
                  {items.map(({ e: it, offerTitle, price, screenshots }, n) => (
                    <li key={it.id} id={`z${it.id}`} className="enq-item">
                      <div className="shots">
                        {screenshots.map((id, i) => (
                          <a key={id} href={`/admin/screenshot/${id}`} target="_blank" rel="noreferrer" className="shot">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/admin/screenshot/${id}`} alt={`Stopklatka ${i + 1} od ${e.name}`} loading="lazy" />
                          </a>
                        ))}
                      </div>
                      <div className="enq-item__body">
                        <Link href={`/admin/oferty/${it.offerId}`}><b>{items.length > 1 && `${n + 1}. `}{offerTitle ?? it.offerId}</b></Link>
                        <div className="small">
                          {it.fishNo ? <b>Ryba nr {it.fishNo} z mapy</b> : it.picks?.length ? `Ryby nr ${it.picks.join(", ")}` : `${it.qty} szt.`}
                          {price ? ` · ${formatPLN(price)} za sztukę` : " · cena do ustalenia"}
                          {it.second && ` · widać ją w ${it.second}`}
                        </div>
                        <div className="fish-row">
                          <span className="small">Ryba: <FishPill fish={it.fish} /></span>
                          {Object.entries(FISH_STATES).filter(([k]) => k !== it.fish).map(([k, v]) => (
                            <form key={k} action={setEnquiryFishAction}>
                              <input type="hidden" name="id" value={it.id} />
                              <input type="hidden" name="offerId" value={it.offerId} />
                              <input type="hidden" name="fish" value={k} />
                              <button type="submit" className={k === "sprzedana" ? "btn btn--primary btn--sm" : "chip"}>
                                {k === "wolna" ? "Wolna (ukryj ze strony)" : v}
                              </button>
                            </form>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
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
                    <span className="muted">Znikną dane klienta i {items.length > 1 ? "wszystkie stopklatki z tego zgłoszenia" : "stopklatki"}, także spod filmików. Tego nie da się cofnąć.</span>
                    <button type="submit" className="btn btn--sm">Tak, usuń na zawsze</button>
                  </form>
                </details>
              </li>
            );
          })}
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
