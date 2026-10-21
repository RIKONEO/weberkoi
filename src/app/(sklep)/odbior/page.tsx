import type { Metadata } from "next";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = { title: "Odbiór osobisty" };

export default function PickupPage() {
  return (
    <div className="wrap section flow prose">
      <h1 className="page-title">Odbiór osobisty</h1>
      <p>
        Ryby odbierasz u nas na miejscu, nie wysyłamy ich kurierem. Dzięki temu nie spędzają doby w kartonie i możesz je
        zobaczyć na żywo, zanim zabierzesz je do domu.
      </p>
      <dl className="specs">
        <dt>Adres</dt>
        <dd>
          {CONTACT.street}, {CONTACT.city}
        </dd>
        <dt>Telefon</dt>
        <dd>
          <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> ({CONTACT.person})
        </dd>
      </dl>
      <p>
        Termin odbioru ustalimy z Tobą po zgłoszeniu albo telefonicznie. Rybę pakujemy na miejscu w worek z tlenem, więc spokojnie
        dowieziesz ją do swojego stawu.
      </p>
      <p>Płacisz gotówką przy odbiorze albo wcześniej przelewem na konto, które podamy po potwierdzeniu zgłoszenia.</p>
    </div>
  );
}
