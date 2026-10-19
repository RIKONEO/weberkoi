"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { KoiThumb } from "@/components/OfferVideo";
import { formatPLN } from "@/lib/offers";

export default function CartPage() {
  const { lines, ready, total, remove } = useCart();
  return (
    <div className="wrap section flow">
      <h1 className="page-title">Koszyk</h1>
      {!ready ? null : !lines.length ? (
        <>
          <p className="empty">Koszyk jest pusty. Wybierz rybę w katalogu, aby ją tu dodać.</p>
          <div><Link href="/katalog" className="btn">Przejdź do katalogu</Link></div>
        </>
      ) : (
        <>
          <ul className="lines">
            {lines.map((l, i) => {
              return (
                <li key={`${l.offerId}-${i}`} className="line">
                  <KoiThumb variety={l.variety} />
                  <div>
                    <Link href={`/oferta/${l.offerId}`}><b>{l.title}</b></Link>
                    <div className="muted small">
                      {l.size} · {l.picks ? `ryby nr ${l.picks.join(", ")}` : `${l.qty} szt. wybranych przez nas`}
                    </div>
                    <button type="button" className="link-btn small" onClick={() => remove(i)}>Usuń</button>
                  </div>
                  <div className="price num">{formatPLN(l.qty * l.unitPrice)}</div>
                </li>
              );
            })}
          </ul>
          <div className="total">
            <span>Suma bez dostawy</span>
            <b className="num">{formatPLN(total)}</b>
          </div>
          <div className="row row--end">
            <Link href="/katalog" className="btn">Wybierz więcej ryb</Link>
            <Link href="/kasa" className="btn btn--primary">Przejdź do kasy</Link>
          </div>
        </>
      )}
    </div>
  );
}
