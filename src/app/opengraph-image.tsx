import { listOffers } from "@/lib/data";
import { OG_SIZE, fetchPhoto, renderOg } from "@/lib/og";

export const alt = "WEBER Nishikigoi: koi z Japonii i z naszej hodowli, każda ryba na filmiku";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image() {
  // Zdjęcie z pierwszej oferty, która ma miniaturę filmiku (wyróżnione są na początku listy).
  const offers = await listOffers().catch(() => []);
  const withPhoto = offers.find((o) => o.posterUrl);
  return renderOg({
    eyebrow: "Sklep z koi",
    title: "Każda ryba na filmiku, zanim trafi do Twojego stawu",
    lines: ["Koi z Japonii i z naszej hodowli"],
    photo: await fetchPhoto(withPhoto?.posterUrl),
  });
}
