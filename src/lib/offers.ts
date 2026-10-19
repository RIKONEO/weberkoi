// Oferty sklepu. Na razie dane przykładowe w kodzie; w kroku 3 przeniesiemy je do bazy
// i panelu admina, zachowując ten sam kształt typu Offer.

export type Variety =
  | "Kohaku"
  | "Taisho Sanke"
  | "Showa Sanshoku"
  | "Tancho"
  | "Ogon"
  | "Chagoi"
  | "Asagi";

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
  /** Numery ryb już sprzedanych. */
  sold: number[];
  /** Cena za sztukę w złotych; null oznacza „zapytaj o cenę”. */
  price: number | null;
  /** Adres filmiku (np. Bunny Stream). Brak = zaślepka, dopóki nie wgramy filmików. */
  videoUrl?: string;
  posterUrl?: string;
  videoLength?: string;
  description: string;
  addedAt: string;
};

export const OFFERS: Offer[] = [
  {
    id: "kohaku-tosai-2024",
    variety: "Kohaku",
    title: "Kohaku, grupa 20 ryb",
    breeder: "Hodowla Sakai, Japonia",
    age: "Tosai (2024)",
    sizeCm: [15, 20],
    count: 20,
    sold: [3, 8, 14],
    price: 290,
    videoLength: "1:48",
    description:
      "Białe ciało z czerwonymi plamami hi na grzbiecie. Dobre proporcje i czysta biel, ryby gotowe do stawu od wiosny.",
    addedAt: "2026-10-14",
  },
  {
    id: "showa-nisai-2023",
    variety: "Showa Sanshoku",
    title: "Showa Sanshoku, grupa 12 ryb",
    breeder: "Hodowla Dainichi, Japonia",
    age: "Nisai (2023)",
    sizeCm: [30, 35],
    count: 12,
    sold: [5],
    price: null,
    videoLength: "2:10",
    description:
      "Czarna baza z czerwienią i bielą. Ryby o dużym potencjale wzrostu, cena zależy od wybranej sztuki.",
    addedAt: "2026-10-12",
  },
  {
    id: "sanke-tosai-2024",
    variety: "Taisho Sanke",
    title: "Taisho Sanke, grupa 16 ryb",
    breeder: "Hodowla Marudo, Japonia",
    age: "Tosai (2024)",
    sizeCm: [18, 22],
    count: 16,
    sold: [],
    price: 340,
    videoLength: "1:35",
    description: "Biel, czerwień i drobne czarne plamy sumi. Spokojne, dobrze karmione ryby.",
    addedAt: "2026-10-16",
  },
  {
    id: "chagoi-nisai-2023",
    variety: "Chagoi",
    title: "Chagoi, grupa 8 ryb",
    breeder: "Hodowla własna, Polska",
    age: "Nisai (2023)",
    sizeCm: [35, 40],
    count: 8,
    sold: [2, 6],
    price: 420,
    videoLength: "1:12",
    description: "Brązowe, bardzo ufne koi, które szybko uczą się jeść z ręki i ośmielają resztę stawu.",
    addedAt: "2026-10-08",
  },
  {
    id: "ogon-tosai-2024",
    variety: "Ogon",
    title: "Yamabuki Ogon, grupa 25 ryb",
    breeder: "Hodowla własna, Polska",
    age: "Tosai (2024)",
    sizeCm: [12, 15],
    count: 25,
    sold: [1, 2, 9, 17],
    price: 120,
    videoLength: "1:55",
    description: "Jednolicie złote, metaliczne koi. Dobrze widoczne nawet w ciemniejszej wodzie.",
    addedAt: "2026-10-17",
  },
  {
    id: "tancho-sansai-2022",
    variety: "Tancho",
    title: "Tancho Kohaku, grupa 4 ryb",
    breeder: "Hodowla Isa, Japonia",
    age: "Sansai (2022)",
    sizeCm: [45, 50],
    count: 4,
    sold: [],
    price: null,
    videoLength: "0:58",
    description: "Biała ryba z jedną czerwoną plamą na głowie. Duże, dojrzałe sztuki do wymagającego stawu.",
    addedAt: "2026-10-10",
  },
  {
    id: "asagi-nisai-2023",
    variety: "Asagi",
    title: "Asagi, grupa 10 ryb",
    breeder: "Hodowla własna, Polska",
    age: "Nisai (2023)",
    sizeCm: [25, 30],
    count: 10,
    sold: [4],
    price: 260,
    videoLength: "1:20",
    description: "Niebiesko-szary grzbiet z siatką łusek i czerwone boki. Klasyczna, stara odmiana.",
    addedAt: "2026-10-05",
  },
];

export const VARIETIES: Variety[] = [
  "Kohaku",
  "Taisho Sanke",
  "Showa Sanshoku",
  "Tancho",
  "Ogon",
  "Chagoi",
  "Asagi",
];

export const SIZE_FILTERS = [
  { id: "do-20", label: "do 20 cm", test: (o: Offer) => o.sizeCm[1] <= 20 },
  { id: "20-35", label: "20–35 cm", test: (o: Offer) => o.sizeCm[1] > 20 && o.sizeCm[1] <= 35 },
  { id: "od-35", label: "powyżej 35 cm", test: (o: Offer) => o.sizeCm[1] > 35 },
] as const;

export function getOffer(id: string): Offer | undefined {
  return OFFERS.find((o) => o.id === id);
}

export function available(o: Offer): number {
  return o.count - o.sold.length;
}

export function sizeLabel(o: Offer): string {
  return `${o.sizeCm[0]}–${o.sizeCm[1]} cm`;
}

export function formatPLN(n: number): string {
  return `${n.toLocaleString("pl-PL")} zł`;
}
