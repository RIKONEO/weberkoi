import type { Metadata } from "next";
import Link from "next/link";
import { OfferCard } from "@/components/OfferCard";
import { OFFERS, SIZE_FILTERS, VARIETIES } from "@/lib/offers";

export const metadata: Metadata = { title: "Katalog koi" };

type Search = { odmiana?: string; rozmiar?: string; cena?: string };

function href(cur: Search, patch: Search) {
  const next = { ...cur, ...patch };
  const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
  return qs ? `/katalog?${qs}` : "/katalog";
}

export default async function Catalog({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const size = SIZE_FILTERS.find((s) => s.id === sp.rozmiar);
  const list = OFFERS.filter(
    (o) =>
      (!sp.odmiana || o.variety === sp.odmiana) &&
      (!size || size.test(o)) &&
      (sp.cena !== "stala" || o.price !== null) &&
      (sp.cena !== "zapytaj" || o.price === null),
  ).sort((a, b) => b.addedAt.localeCompare(a.addedAt));

  return (
    <div className="wrap section">
      <div className="eyebrow">Katalog</div>
      <h1 className="page-title">Koi na sprzedaż</h1>

      <div className="filters" aria-label="Filtry">
        <div className="filters__row">
          <span className="eyebrow">Odmiana</span>
          <Link className="chip" aria-pressed={!sp.odmiana} href={href(sp, { odmiana: undefined })}>Wszystkie</Link>
          {VARIETIES.map((v) => (
            <Link key={v} className="chip" aria-pressed={sp.odmiana === v} href={href(sp, { odmiana: v })}>{v}</Link>
          ))}
        </div>
        <div className="filters__row">
          <span className="eyebrow">Rozmiar</span>
          <Link className="chip" aria-pressed={!size} href={href(sp, { rozmiar: undefined })}>Każdy</Link>
          {SIZE_FILTERS.map((s) => (
            <Link key={s.id} className="chip" aria-pressed={sp.rozmiar === s.id} href={href(sp, { rozmiar: s.id })}>{s.label}</Link>
          ))}
          <span className="eyebrow filters__gap">Cena</span>
          <Link className="chip" aria-pressed={!sp.cena} href={href(sp, { cena: undefined })}>Każda</Link>
          <Link className="chip" aria-pressed={sp.cena === "stala"} href={href(sp, { cena: "stala" })}>Cena stała</Link>
          <Link className="chip" aria-pressed={sp.cena === "zapytaj"} href={href(sp, { cena: "zapytaj" })}>Zapytaj o cenę</Link>
        </div>
      </div>

      {list.length ? (
        <div className="grid">
          {list.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </div>
      ) : (
        <p className="empty">
          Brak ofert dla tych filtrów. <Link href="/katalog">Pokaż wszystkie</Link>
        </p>
      )}
    </div>
  );
}
