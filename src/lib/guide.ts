// Teksty o karpiach koi dla klientów i dla Google: pytania i odpowiedzi (strona główna i poradnik /karpie-koi).
import { PICKUP_TEXT } from "./pickup";

export const GUIDE = {
  path: "/karpie-koi",
  title: "Karpie koi: jak wybrać i kupić koi do stawu",
  short: "Poradnik",
} as const;

export type Faq = { q: string; a: string };

export const FAQ: Faq[] = [
  {
    q: "Gdzie kupić karpie koi?",
    a: "U nas, w WEBER Nishikigoi w Zakrzewie (77-424, ul. Za torami 1). Wszystkie ryby na sprzedaż są w katalogu na weberkoi.pl, każda grupa na filmiku. Wybierasz rybę na filmiku, wysyłasz zgłoszenie, a my potwierdzamy rezerwację i umawiamy odbiór.",
  },
  {
    q: "Czy wysyłacie koi kurierem?",
    a: "Nie. Ryby odbierasz osobiście w Zakrzewie, pakujemy je na miejscu w worek z tlenem. Dzięki temu nie spędzają doby w kartonie, a Ty możesz zobaczyć je na żywo przed zabraniem do domu.",
  },
  {
    q: "Jak zapłacić za rybę?",
    a: "Gotówką przy odbiorze albo wcześniej przelewem na konto, które podajemy po potwierdzeniu zgłoszenia. Na stronie nie ma płatności online.",
  },
  {
    q: "Jak długo rezerwujecie wybraną rybę?",
    a: `Rezerwacja trwa ${PICKUP_TEXT} od wysłania zgłoszenia. Jeśli potrzebujesz więcej czasu na odbiór, zadzwoń, na pewno się dogadamy.`,
  },
  {
    q: "Skąd pochodzą wasze koi?",
    a: "Mamy koi z Japonii i z naszej własnej hodowli. Przy każdej ofercie podajemy hodowcę, odmianę, rozmiar i wiek ryb.",
  },
  {
    q: "Ile kosztuje karp koi?",
    a: "Cena zależy od odmiany, rozmiaru, wieku i jakości wzoru. Przy każdej ofercie w katalogu jest cena za sztukę. Jeśli widzisz „zapytaj o cenę”, zadzwoń albo napisz, a podamy ją od razu.",
  },
];

/** Dane FAQPage dla Google z listy pytań. */
export function faqSchema(items: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
