import type { Metadata } from "next";
import { DELIVERY, formatDay, nextDays, SHIPPING_WEEKDAYS } from "@/lib/shipping";
import { formatPLN } from "@/lib/offers";
import { getShippingPaused } from "@/lib/data";

export const metadata: Metadata = { title: "Wysyłka i odbiór" };
export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const paused = await getShippingPaused();
  return (
    <div className="wrap section flow prose">
      <h1 className="page-title">Wysyłka i odbiór</h1>
      <p>
        Ryby pakujemy w worki z tlenem i kartony termiczne. Wysyłamy w poniedziałki, wtorki i środy, a kurier dostarcza je
        następnego dnia roboczego. Koszt wysyłki: {formatPLN(DELIVERY.kurier.price)}.
      </p>
      {paused ? (
        <p className="notice notice--warn">Wysyłki kurierem są teraz wstrzymane z powodu pogody. Zapraszamy po odbiór osobisty.</p>
      ) : (
        <p>Najbliższe dni wysyłki: {nextDays(SHIPPING_WEEKDAYS, 3).map((d) => formatDay(d)).join(", ")}.</p>
      )}
      <p>W upały i mrozy wstrzymujemy wysyłki, żeby ryby nie ucierpiały. Wtedy w kasie dostępny jest tylko odbiór osobisty.</p>
      <h2>Odbiór osobisty</h2>
      <p>{DELIVERY.odbior.note}. Termin wybierasz przy zamówieniu. Na miejscu możesz zapłacić gotówką lub kartą.</p>
      <p className="notice notice--warn">Adres, godziny i koszt kuriera są przykładowe. Uzupełnimy je Waszymi danymi.</p>
    </div>
  );
}
