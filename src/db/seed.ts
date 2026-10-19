// Przykładowe oferty na start. Uruchom: npm run db:seed (nie nadpisuje istniejących ofert).
import { db, schema, sql } from "./index";

const OFFERS: (typeof schema.offers.$inferInsert)[] = [
  {
    id: "kohaku-tosai-2024",
    variety: "Kohaku",
    title: "Kohaku, grupa 20 ryb",
    breeder: "Hodowla Sakai, Japonia",
    age: "Tosai (2024)",
    sizeMin: 15,
    sizeMax: 20,
    count: 20,
    sold: [3, 8, 14],
    price: 290,
    videoLength: "1:48",
    description:
      "Białe ciało z czerwonymi plamami hi na grzbiecie. Dobre proporcje i czysta biel, ryby gotowe do stawu od wiosny.",
    addedAt: new Date("2026-10-14T12:00:00+02:00"),
  },
  {
    id: "showa-nisai-2023",
    variety: "Showa Sanshoku",
    title: "Showa Sanshoku, grupa 12 ryb",
    breeder: "Hodowla Dainichi, Japonia",
    age: "Nisai (2023)",
    sizeMin: 30,
    sizeMax: 35,
    count: 12,
    sold: [5],
    price: null,
    videoLength: "2:10",
    description:
      "Czarna baza z czerwienią i bielą. Ryby o dużym potencjale wzrostu, cena zależy od wybranej sztuki.",
    addedAt: new Date("2026-10-12T12:00:00+02:00"),
  },
  {
    id: "sanke-tosai-2024",
    variety: "Taisho Sanke",
    title: "Taisho Sanke, grupa 16 ryb",
    breeder: "Hodowla Marudo, Japonia",
    age: "Tosai (2024)",
    sizeMin: 18,
    sizeMax: 22,
    count: 16,
    sold: [],
    price: 340,
    videoLength: "1:35",
    description: "Biel, czerwień i drobne czarne plamy sumi. Spokojne, dobrze karmione ryby.",
    addedAt: new Date("2026-10-16T12:00:00+02:00"),
  },
  {
    id: "chagoi-nisai-2023",
    variety: "Chagoi",
    title: "Chagoi, grupa 8 ryb",
    breeder: "Hodowla własna, Polska",
    age: "Nisai (2023)",
    sizeMin: 35,
    sizeMax: 40,
    count: 8,
    sold: [2, 6],
    price: 420,
    videoLength: "1:12",
    description: "Brązowe, bardzo ufne koi, które szybko uczą się jeść z ręki i ośmielają resztę stawu.",
    addedAt: new Date("2026-10-08T12:00:00+02:00"),
  },
  {
    id: "ogon-tosai-2024",
    variety: "Ogon",
    title: "Yamabuki Ogon, grupa 25 ryb",
    breeder: "Hodowla własna, Polska",
    age: "Tosai (2024)",
    sizeMin: 12,
    sizeMax: 15,
    count: 25,
    sold: [1, 2, 9, 17],
    price: 120,
    videoLength: "1:55",
    description: "Jednolicie złote, metaliczne koi. Dobrze widoczne nawet w ciemniejszej wodzie.",
    addedAt: new Date("2026-10-17T12:00:00+02:00"),
  },
  {
    id: "tancho-sansai-2022",
    variety: "Tancho",
    title: "Tancho Kohaku, grupa 4 ryb",
    breeder: "Hodowla Isa, Japonia",
    age: "Sansai (2022)",
    sizeMin: 45,
    sizeMax: 50,
    count: 4,
    sold: [],
    price: null,
    videoLength: "0:58",
    description: "Biała ryba z jedną czerwoną plamą na głowie. Duże, dojrzałe sztuki do wymagającego stawu.",
    addedAt: new Date("2026-10-10T12:00:00+02:00"),
  },
  {
    id: "asagi-nisai-2023",
    variety: "Asagi",
    title: "Asagi, grupa 10 ryb",
    breeder: "Hodowla własna, Polska",
    age: "Nisai (2023)",
    sizeMin: 25,
    sizeMax: 30,
    count: 10,
    sold: [4],
    price: 260,
    videoLength: "1:20",
    description: "Niebiesko-szary grzbiet z siatką łusek i czerwone boki. Klasyczna, stara odmiana.",
    addedAt: new Date("2026-10-05T12:00:00+02:00"),
  },
];

async function main() {
  const res = await db.insert(schema.offers).values(OFFERS).onConflictDoNothing().returning({ id: schema.offers.id });
  await db.insert(schema.settings).values({ key: "shippingPaused", value: false }).onConflictDoNothing();
  console.log(`Dodano ${res.length} ofert.`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
