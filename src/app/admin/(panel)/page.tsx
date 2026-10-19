import Link from "next/link";
import { dashboardCounts, getShippingPaused } from "@/lib/data";

export default async function Dashboard() {
  const [c, paused] = await Promise.all([dashboardCounts(), getShippingPaused()]);
  return (
    <div className="stack">
      <h1 className="page-title">Panel sklepu</h1>
      {paused && <p className="notice notice--warn">Wysyłki kurierem są wstrzymane. <Link href="/admin/ustawienia">Zmień w ustawieniach</Link></p>}
      <div className="stats">
        <Link href="/admin/zamowienia" className="stat"><b className="num">{c.openOrders}</b><span>zamówień do obsłużenia</span></Link>
        <Link href="/admin/zapytania" className="stat"><b className="num">{c.newEnquiries}</b><span>nowych zapytań o cenę</span></Link>
        <Link href="/admin/oferty" className="stat"><b className="num">{c.liveOffers}</b><span>ofert w sklepie</span></Link>
      </div>
      <div><Link href="/admin/oferty/nowa" className="btn btn--primary">+ Dodaj ofertę z filmikiem</Link></div>
    </div>
  );
}
