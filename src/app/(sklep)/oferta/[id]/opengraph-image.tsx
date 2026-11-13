import { getOffer } from "@/lib/data";
import { available, formatPLN, sizeLabel } from "@/lib/offers";
import { OG_SIZE, fetchPhoto, renderOg } from "@/lib/og";

export const alt = "Oferta koi w sklepie WEBER Nishikigoi";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const offer = await getOffer((await params).id);
  if (!offer) {
    return renderOg({ eyebrow: "Sklep z koi", title: "Koi na filmiku", lines: ["Koi z Japonii i z naszej hodowli"] });
  }
  const left = available(offer);
  return renderOg({
    eyebrow: offer.variety,
    title: offer.title,
    lines: [[sizeLabel(offer), offer.age].filter(Boolean).join(" · "), left > 0 ? `${left} z ${offer.count} dostępnych` : "Wszystkie sprzedane"],
    price: offer.price ? `${formatPLN(offer.price)} / szt.` : "Zapytaj o cenę",
    photo: await fetchPhoto(offer.posterUrl),
  });
}
