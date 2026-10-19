import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ORDER_STATUSES, getOrderWithItems } from "@/lib/data";
import { formatPLN } from "@/lib/offers";
import { PAYMENTS, type PaymentMethod } from "@/lib/orders";
import { formatDay } from "@/lib/shipping";
import { updateOrderAction } from "../../../actions";
import { Flash } from "@/components/admin/Flash";
import { StatusPill } from "@/components/admin/StatusPill";

type Props = { params: Promise<{ no: string }>; searchParams: Promise<{ zapisano?: string; blad?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Zamówienie ${(await params).no}` };
}

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ no }, sp] = await Promise.all([params, searchParams]);
  const o = await getOrderWithItems(no);
  if (!o) notFound();
  return (
    <div className="stack admin-narrow">
      <Link href="/admin/zamowienia" className="back">← Zamówienia</Link>
      <div className="row"><h1 className="page-title">{o.no}</h1><StatusPill status={o.status} /></div>
      <Flash saved={sp.zapisano} error={sp.blad} />
      <div className="tscroll">
        <table>
          <thead><tr><th>Oferta</th><th>Wybór</th><th className="r">Szt.</th><th className="r">Kwota</th></tr></thead>
          <tbody>
            {o.items.map((it) => (
              <tr key={it.id}>
                <td><Link href={`/admin/oferty/${it.offerId}`}>{it.title}</Link></td>
                <td>{it.picks?.length ? `ryby nr ${it.picks.join(", ")}` : "z grupy, wybieramy my"}</td>
                <td className="r num">{it.qty}</td>
                <td className="r num">{formatPLN(it.qty * it.unitPrice)}</td>
              </tr>
            ))}
            <tr><td colSpan={3}>Dostawa</td><td className="r num">{formatPLN(o.deliveryPrice)}</td></tr>
            <tr><td colSpan={3}><b>Razem</b></td><td className="r num"><b>{formatPLN(o.total)}</b></td></tr>
          </tbody>
        </table>
      </div>
      <dl className="specs">
        <dt>Klient</dt><dd>{o.name}</dd>
        <dt>E-mail</dt><dd>{o.email}</dd>
        <dt>Telefon</dt><dd>{o.phone}</dd>
        <dt>Dostawa</dt><dd>{o.delivery === "kurier" ? `Kurier, wysyłka ${formatDay(o.day, true)}` : `Odbiór osobisty, ${formatDay(o.day, true)}`}</dd>
        {o.delivery === "kurier" && <><dt>Adres</dt><dd>{o.street}, {o.city}</dd></>}
        <dt>Płatność</dt>
        <dd>
          {PAYMENTS[o.payment as PaymentMethod]?.label ?? o.payment}
          {o.paidAt ? `, zapłacono ${o.paidAt.toLocaleString("pl-PL")}` : o.payment === "online" ? ", jeszcze nie zapłacono" : ""}
          {o.stripeSessionId && <> · <a href={`https://dashboard.stripe.com/checkout/sessions/${o.stripeSessionId}`} target="_blank" rel="noreferrer">Stripe</a></>}
        </dd>
        <dt>Złożone</dt><dd>{o.createdAt.toLocaleString("pl-PL")}</dd>
      </dl>
      <form action={updateOrderAction} className="panel">
        <input type="hidden" name="no" value={o.no} />
        <label className="field">Status
          <select id="status" name="status" defaultValue={o.status}>
            {Object.entries(ORDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <p className="muted small">
          Anulowanie zwalnia zarezerwowane ryby z powrotem do sprzedaży.{o.paidAt && " Pieniądze za opłacone zamówienie zwracasz w panelu Stripe."}
        </p>
        {o.delivery === "kurier" && (
          <label className="field">Numer przesyłki<input id="trackingNo" name="trackingNo" defaultValue={o.trackingNo ?? ""} /></label>
        )}
        <label className="field">Notatka wewnętrzna<textarea id="note" name="note" rows={2} defaultValue={o.note ?? ""} /></label>
        <div><button type="submit" className="btn btn--primary">Zapisz</button></div>
      </form>
    </div>
  );
}
