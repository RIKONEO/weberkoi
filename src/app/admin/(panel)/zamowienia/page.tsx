import type { Metadata } from "next";
import Link from "next/link";
import { ORDER_STATUSES, listOrders } from "@/lib/data";
import { formatPLN } from "@/lib/offers";
import { formatDay } from "@/lib/shipping";
import { StatusPill } from "@/components/admin/StatusPill";

export const metadata: Metadata = { title: "Zamówienia" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const rows = await listOrders(status && status in ORDER_STATUSES ? status : undefined);
  return (
    <div className="stack">
      <h1 className="page-title">Zamówienia</h1>
      <div className="row">
        <Link className="chip" aria-pressed={!status} href="/admin/zamowienia">Wszystkie</Link>
        {Object.entries(ORDER_STATUSES).map(([k, v]) => (
          <Link key={k} className="chip" aria-pressed={status === k} href={`/admin/zamowienia?status=${k}`}>{v}</Link>
        ))}
      </div>
      {rows.length ? (
        <div className="tscroll">
          <table>
            <thead><tr><th>Nr</th><th>Złożone</th><th>Klient</th><th>Dostawa</th><th className="r">Kwota</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/zamowienia/${o.no}`}>{o.no}</Link></td>
                  <td className="num">{o.createdAt.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>{o.name}</td>
                  <td>{o.delivery === "kurier" ? "Kurier" : "Odbiór"} · {formatDay(o.day)}</td>
                  <td className="r num">{formatPLN(o.total)}</td>
                  <td><StatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">Brak zamówień{status ? " z tym statusem" : ""}.</p>
      )}
    </div>
  );
}
