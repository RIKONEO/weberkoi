import type { Metadata } from "next";
import { DELIVERY, formatDay, nextDays, SHIPPING_WEEKDAYS } from "@/lib/shipping";
import { formatPLN } from "@/lib/offers";
import { getShippingPaused } from "@/lib/data";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = { title: "Wysyłka i odbiór" };
export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const paused = await getShippingPaused();
  return (
    <div className="wrap section flow prose">
      <h1 className="page-title">Wysyłka i odbiór</h1>
      <p>
        Ryby pakujemy w worki z tlenem i kartony termiczne. Wysyłamy w poniedziałki, wtorki i środy, a kurier dostarcza je
        następnego dnia roboczego. Koszt wysyłki: {formatPLN(DELIVERY.kurier.price)}. Za rybę i wysyłkę płacisz przelewem na nasze konto,
        które podamy po potwierdzeniu zgłoszenia.
      </p>
      {paused ? (
        <p className="notice notice--warn">Wysyłki kurierem są teraz wstrzymane z powodu pogody. Zapraszamy po odbiór osobisty.</p>
      ) : (
        <p>Najbliższe dni wysyłki: {nextDays(SHIPPING_WEEKDAYS, 3).map((d) => formatDay(d)).join(", ")}.</p>
      )}
      <p>W upały i mrozy wstrzymujemy wysyłki, żeby ryby nie ucierpiały. Wtedy zapraszamy po odbiór osobisty.</p>
      <h2>Odbiór osobisty</h2>
      <p>
        Zapraszamy na {DELIVERY.odbior.note}. Termin odbioru ustalimy z Tobą po zgłoszeniu albo telefonicznie pod numerem{" "}
        <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>. Na miejscu możesz zapłacić gotówką.
      </p>
    </div>
  );
}
