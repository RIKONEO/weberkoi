// Typ oferty i funkcje pomocnicze wspólne dla sklepu i panelu. Dane są w bazie
// (src/lib/data.ts); przykładowe oferty do startu są w src/db/seed.ts.

/** Nazwa odmiany; lista odmian jest w bazie (tabela varieties). */
export type Variety = string;

export type Offer = {
  id: string;
  variety: Variety;
  title: string;
  breeder: string;
  age: string;
  /** Zakres długości ryb w grupie, w cm. */
  sizeCm: [number, number];
  /** Liczba ryb na filmiku, numerowanych od 1. */
  count: number;
  /** Numery ryb już sprzedanych albo zarezerwowanych. */
  sold: number[];
  /** Ryby sprzedane „z grupy”, bez wskazanego numeru. */
  groupSold: number;
  /** Cena za sztukę w złotych; null oznacza „zapytaj o cenę”. */
  price: number | null;
  /** Adres filmiku (np. Bunny Stream). Brak = zaślepka, dopóki nie wgramy filmików. */
  videoUrl?: string;
  posterUrl?: string;
  videoLength?: string;
  description: string;
  published: boolean;
  /** Wyróżniona: pokazywana na górze strony głównej i katalogu. */
  featured: boolean;
  addedAt: string;
};


export const SIZE_FILTERS = [
  { id: "do-20", label: "do 20 cm", test: (o: Offer) => o.sizeCm[1] <= 20 },
  { id: "20-35", label: "20–35 cm", test: (o: Offer) => o.sizeCm[1] > 20 && o.sizeCm[1] <= 35 },
  { id: "od-35", label: "powyżej 35 cm", test: (o: Offer) => o.sizeCm[1] > 35 },
] as const;

export function available(o: Offer): number {
  return Math.max(0, o.count - o.sold.length - o.groupSold);
}

export function sizeLabel(o: Offer): string {
  return `${o.sizeCm[0]}–${o.sizeCm[1]} cm`;
}

export function formatPLN(n: number): string {
  return `${n.toLocaleString("pl-PL")} zł`;
}
