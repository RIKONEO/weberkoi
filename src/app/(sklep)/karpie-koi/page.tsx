import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { listVarieties } from "@/lib/data";
import { FAQ, GUIDE, faqSchema } from "@/lib/guide";
import { breadcrumbSchema } from "@/lib/schema-org";
import { OPEN_GRAPH_BASE } from "@/lib/site";
import { varietySlug } from "@/lib/varieties";
import { CONTACT } from "@/lib/contact";

const description =
  "Poradnik o karpiach koi: odmiany (Kohaku, Showa, Sanke, Ogon, Chagoi), jak wybrać zdrową rybę, jaki staw jest potrzebny i jak przewieźć koi do domu. Sklep z koi w Zakrzewie.";

export const metadata: Metadata = {
  title: GUIDE.title,
  description,
  alternates: { canonical: GUIDE.path },
  openGraph: { ...OPEN_GRAPH_BASE, type: "article", title: GUIDE.title, description, url: GUIDE.path },
};
export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const varieties = await listVarieties();
  return (
    <article className="wrap section flow prose guide">
      <JsonLd data={faqSchema(FAQ)} />
      <JsonLd data={breadcrumbSchema([{ name: "Karpie koi", path: GUIDE.path }])} />
      <div className="eyebrow">Poradnik</div>
      <h1 className="page-title">Karpie koi: jak wybrać i kupić koi do stawu</h1>
      <p>
        Karpie koi (po japońsku nishikigoi) to ozdobne odmiany karpia, hodowane w Japonii od ponad dwustu lat. Żyją kilkadziesiąt lat,
        rosną do 60–90 cm i szybko uczą się jeść z ręki. W WEBER Nishikigoi w Zakrzewie sprzedajemy koi z Japonii i z naszej hodowli.
        Każdą grupę ryb pokazujemy na filmiku, więc wybierasz konkretną rybę, a nie „podobną ze zdjęcia”.
      </p>
      <p>
        <Link href="/katalog" className="btn btn--primary">Zobacz koi na sprzedaż</Link>
      </p>

      <h2>Odmiany koi</h2>
      <p>
        Odmian jest ponad sto. Najbardziej cenione są trzy klasyczne, nazywane gosanke: Kohaku (biała z czerwonymi plamami), Taisho
        Sanke (jak Kohaku, z czarnymi akcentami) i Showa (czarna z czerwienią i bielą). Na początek świetnie sprawdzają się też ryby
        jednego koloru: metaliczne Ogon i spokojne, ufne Chagoi, które uczą resztę stada podpływać do ręki.
      </p>
      {varieties.length > 0 && (
        <ul className="guide__varieties">
          {varieties.map((v) => (
            <li key={v}>
              <Link href={`/odmiany/${varietySlug(v)}`}>Koi {v}</Link>
            </li>
          ))}
        </ul>
      )}

      <h2>Jak wybrać zdrową rybę</h2>
      <p>
        Zdrowa koi pływa spokojnie i równo, trzyma płetwy rozłożone, nie ociera się o dno i ściany, a jej łuski przylegają gładko. Oczy
        są czyste, skóra bez białego nalotu, czerwonych wybroczyn i ran. Dlatego pokazujemy całe grupy na filmiku: widzisz, jak ryba
        się porusza, a nie tylko jeden kadr. Jeśli chcesz, przyjedź i obejrzyj ryby na żywo przed odbiorem.
      </p>
      <p>
        Przy wyborze wzoru patrz na czystość kolorów i ostre brzegi plam. U młodych ryb, zwłaszcza Showa i Sanke, kolory jeszcze
        dojrzewają i potrafią się mocno zmienić, co dla wielu hodowców jest częścią przyjemności.
      </p>

      <h2>Jaki staw dla koi</h2>
      <p>
        Koi rosną duże, więc potrzebują miejsca. W polskim klimacie dobry staw dla koi ma przynajmniej kilka tysięcy litrów wody i
        głębsze miejsce, około 1,5 m, w którym ryby spokojnie przezimują pod lodem. Ważna jest wydajna filtracja i napowietrzanie,
        bo koi dużo jedzą i dużo wydalają. Lepiej mieć mniej ryb w czystej wodzie niż przeładowany staw.
      </p>

      <h2>Odbiór i transport do domu</h2>
      <p>
        Koi nie wysyłamy kurierem. Odbierasz je osobiście w Zakrzewie ({CONTACT.street}, {CONTACT.city}), a my pakujemy każdą rybę w
        worek z tlenem. Worek wieź w cieniu, najlepiej w kartonie lub termotorbie. W domu połóż zamknięty worek na wodzie w stawie na
        kilkanaście minut, żeby wyrównać temperaturę, a dopiero potem wypuść rybę. Szczegóły są na stronie{" "}
        <Link href="/odbior">Odbiór osobisty</Link>.
      </p>

      <h2>Najczęstsze pytania</h2>
      <div className="faq">
        {FAQ.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>

      <p>
        Masz pytanie o konkretną rybę? Zadzwoń: <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> albo zajrzyj na stronę{" "}
        <Link href="/kontakt">Kontakt</Link>.
      </p>
    </article>
  );
}
