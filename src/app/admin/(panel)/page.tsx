import Link from "next/link";
import { ENQUIRY_STATUSES, dashboardData, getShippingPaused } from "@/lib/data";
import { available, formatPLN, sizeLabel } from "@/lib/offers";
import { StatusPill } from "@/components/admin/StatusPill";

const OWNER = "Marcin";
const TZ = "Europe/Warsaw";

function greeting(now: Date) {
  const h = Number(new Intl.DateTimeFormat("pl-PL", { hour: "numeric", hourCycle: "h23", timeZone: TZ }).format(now));
  return h >= 18 || h < 5 ? "Dobry wieczór" : "Dzień dobry";
}

const shortDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("pl-PL", { day: "numeric", month: "short", timeZone: TZ });

export default async function Dashboard() {
  const [{ status, series, latest, offers }, paused] = await Promise.all([dashboardData(), getShippingPaused()]);
  const now = new Date();
  const live = offers.filter((o) => o.published);
  const fishLeft = live.reduce((s, o) => s + available(o), 0);
  const stockValue = live.reduce((s, o) => s + (o.price ? o.price * available(o) : 0), 0);
  const askCount = live.filter((o) => !o.price).length;
  const week = series.slice(-7).reduce((s, d) => s + d.n, 0);
  const max = Math.max(1, ...series.map((d) => d.n));
  const attention = [
    ...live.filter((o) => !o.videoUrl).map((o) => ({ o, why: "brak filmiku, klienci nie mają z czego zrobić screenshota" })),
    ...live.filter((o) => available(o) === 0).map((o) => ({ o, why: "wszystkie ryby sprzedane, a oferta dalej jest w sklepie" })),
  ];

  return (
    <div className="dash">
      <header className="dash__hello">
        <div>
          <div className="eyebrow">{now.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })}</div>
          <h1 className="page-title">{greeting(now)}, {OWNER}!</h1>
          <p className="muted">
            {status.nowe ? <>Czeka na Ciebie <b className="hl">{status.nowe}</b> {status.nowe === 1 ? "nowe zgłoszenie" : "nowych zgłoszeń"}.</> : "Wszystkie zgłoszenia obsłużone."}{" "}
            W sklepie jest {live.length} ofert i {fishLeft} ryb do sprzedania.
          </p>
        </div>
        <div className="row">
          <Link href="/admin/zapytania?status=nowe" className="btn">Nowe zgłoszenia</Link>
          <Link href="/admin/oferty/nowa" className="btn btn--primary">+ Dodaj ofertę</Link>
        </div>
      </header>

      {paused && <p className="notice notice--warn">Wysyłki kurierem są wstrzymane. <Link href="/admin/ustawienia">Zmień w ustawieniach</Link></p>}

      <section className="kpis" aria-label="Najważniejsze liczby">
        <Link href="/admin/zapytania?status=nowe" className="kpi kpi--hi"><span>Nowe zgłoszenia</span><b className="num">{status.nowe ?? 0}</b><small>do odpisania</small></Link>
        <Link href="/admin/zapytania" className="kpi"><span>Zgłoszenia, 7 dni</span><b className="num">{week}</b><small>{status.odpowiedziano ?? 0} w trakcie, {status.zamkniete ?? 0} zamkniętych łącznie</small></Link>
        <Link href="/admin/oferty" className="kpi"><span>Oferty online</span><b className="num">{live.length}</b><small>{live.filter((o) => o.featured).length} wyróżnionych, {offers.length - live.length} ukrytych</small></Link>
        <Link href="/admin/oferty" className="kpi"><span>Ryby do sprzedania</span><b className="num">{fishLeft}</b><small>w ofertach online</small></Link>
        <div className="kpi"><span>Wartość ryb z ceną</span><b className="num">{formatPLN(stockValue)}</b><small>{askCount ? `+ ${askCount} ofert „zapytaj o cenę”` : "wszystkie oferty mają cenę"}</small></div>
      </section>

      <div className="dash__grid">
        <section className="panel dash__chart">
          <div className="dash__head"><h2>Zgłoszenia z 14 dni</h2><span className="muted small">{series.reduce((s, d) => s + d.n, 0)} łącznie</span></div>
          <div className="bars" role="img" aria-label={`Zgłoszenia dziennie z ostatnich 14 dni, najwięcej ${max} jednego dnia`}>
            {series.map((d) => (
              <div key={d.day} className="bars__col" title={`${shortDay(d.day)}: ${d.n} ${d.n === 1 ? "zgłoszenie" : "zgłoszeń"}`}>
                <span className="bars__val num">{d.n || ""}</span>
                <span className="bars__bar" style={{ height: `${(d.n / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="bars__axis small muted"><span>{shortDay(series[0].day)}</span><span>dziś</span></div>
          <table className="visually-hidden">
            <caption>Zgłoszenia dziennie</caption>
            <tbody>{series.map((d) => <tr key={d.day}><th>{d.day}</th><td>{d.n}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel">
          <div className="dash__head"><h2>Wymaga uwagi</h2></div>
          {attention.length ? (
            <ul className="dash__list">
              {attention.map(({ o, why }) => (
                <li key={o.id + why}><Link href={`/admin/oferty/${o.id}`}><b>{o.title}</b></Link><span className="small muted">{why}</span></li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Wszystko w porządku. Każda oferta online ma filmik i wolne ryby.</p>
          )}
          <div className="dash__status">
            {Object.entries(ENQUIRY_STATUSES).map(([k, v]) => (
              <Link key={k} href={`/admin/zapytania?status=${k}`} className="dash__statusItem"><b className="num">{status[k as keyof typeof status] ?? 0}</b><span className="small muted">{v}</span></Link>
            ))}
          </div>
        </section>

        <section className="panel dash__wide">
          <div className="dash__head"><h2>Ostatnie zgłoszenia</h2><Link href="/admin/zapytania" className="small">Wszystkie →</Link></div>
          {latest.length ? (
            <ul className="dash__list">
              {latest.map(({ e, offerTitle, screenshots }) => (
                <li key={e.id} className="dash__enq">
                  {screenshots[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/admin/screenshot/${screenshots[0]}`} alt="" loading="lazy" />
                  ) : (
                    <span className="dash__noimg" aria-hidden>—</span>
                  )}
                  <div>
                    <b>{e.name}</b> <span className="muted small">· {offerTitle ?? e.offerId}</span>
                    <div className="small muted">{e.phone || e.email} · {e.createdAt.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short", timeZone: TZ })}</div>
                  </div>
                  <StatusPill status={e.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Nie ma jeszcze zgłoszeń.</p>
          )}
        </section>

        <section className="panel dash__wide">
          <div className="dash__head"><h2>Oferty online</h2><Link href="/admin/oferty" className="small">Zarządzaj →</Link></div>
          <ul className="dash__list">
            {live.map((o) => {
              const left = available(o);
              return (
                <li key={o.id} className="dash__offer">
                  <div>
                    <Link href={`/admin/oferty/${o.id}`}><b>{o.title}</b></Link> {o.featured && <span className="pill pill--hi">Wyróżniona</span>}
                    <div className="small muted">{sizeLabel(o)} · {o.price ? formatPLN(o.price) : "zapytaj o cenę"}</div>
                  </div>
                  <div className="stock" title={`${left} z ${o.count} ryb dostępnych`}>
                    <span className="stock__track"><span className="stock__fill" style={{ width: `${(left / o.count) * 100}%` }} /></span>
                    <span className="small num">{left}/{o.count}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
