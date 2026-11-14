import { after, NextResponse } from "next/server";
import { createEnquiries, getFishMap, getOffer, listMapStatuses, pgCode } from "@/lib/data";
import { normalizeImage } from "@/lib/image";
import { type EnquiryItem, checkMapFish, parseBasket } from "@/lib/enquiry";
import { CONTACT } from "@/lib/contact";
import { confirmEnquiry, notifyNewEnquiry } from "@/lib/notify";

const SERVER_ERROR = `Coś poszło nie tak po naszej stronie. Spróbuj jeszcze raz za chwilę albo zadzwoń: ${CONTACT.phone}.`;

/** Stopklatka do zgłoszenia, bez wymiarów (zgłoszenia ich nie potrzebują). */
async function normalize(file: File) {
  const img = await normalizeImage(file, 1600, "zgłoszenie");
  return img && { mime: img.mime, data: img.data };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Nieprawidłowe zgłoszenie." }, { status: 400 });
    // Pole niewidoczne dla ludzi; wypełniają je tylko boty.
    if (String(form.get("website") ?? "")) return NextResponse.json({ ok: true });
    const parsed = await parseBasket(form, (id) => getOffer(id));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

    // Ryby z mapy: numer musi być na mapie i jeszcze wolny.
    const mapOffers = [...new Map(parsed.value.items.filter((it) => it.fishNo).map((it) => [it.offerId, it.offer])).values()];
    const maps = new Map<string, { numbers: Set<number>; taken: Set<number> }>();
    for (const offer of mapOffers) {
      const [map, statuses] = await Promise.all([getFishMap(offer.id), listMapStatuses(offer)]);
      if (map) maps.set(offer.id, { numbers: new Set(map.markers.map((m) => m.n)), taken: new Set(Object.keys(statuses).map(Number)) });
    }
    const fishError = checkMapFish(parsed.value.items, maps);
    if (fishError) return NextResponse.json({ error: fishError }, { status: 409 });

    const items: { item: EnquiryItem; screenshots: { mime: string; data: Buffer }[] }[] = [];
    for (const it of parsed.value.items) {
      const screenshots: { mime: string; data: Buffer }[] = [];
      for (const file of it.files) {
        const shot = await normalize(file);
        if (!shot) return NextResponse.json({ error: `„${it.offer.title}”: nie udało się odczytać zdjęcia. Spróbuj z innym plikiem.` }, { status: 422 });
        screenshots.push(shot);
      }
      items.push({ item: { offerId: it.offerId, qty: it.qty, second: it.second, fishNo: it.fishNo ?? null }, screenshots });
    }

    const { contact } = parsed.value;
    let ids: number[];
    try {
      ids = await createEnquiries(contact, items);
    } catch (err) {
      // Ktoś zarezerwował tę samą rybę z mapy dosłownie w tej samej chwili.
      if (pgCode(err) === "23505") {
        return NextResponse.json({ error: "Jedną z ryb z mapy ktoś właśnie zarezerwował. Odśwież stronę oferty, sprawdź, które są wolne, i wyślij jeszcze raz." }, { status: 409 });
      }
      throw err;
    }
    // E-mail do sklepu wysyłamy już po odpowiedzi dla klienta: nie czeka na niego,
    // a błąd poczty (zły klucz, Resend niedostępny) tylko ląduje w logach.
    const mailItems = parsed.value.items.map((it, i) => ({ id: ids[i], offer: it.offer, qty: it.qty, second: it.second, fishNo: it.fishNo ?? null, screenshots: items[i].screenshots }));
    after(async () => {
      // Dwa maile niezależnie: błąd jednego nie blokuje drugiego.
      const results = await Promise.allSettled([notifyNewEnquiry(contact, mailItems), confirmEnquiry(contact, mailItems)]);
      results.forEach((r, i) => {
        if (r.status === "rejected") console.error(`zgłoszenie: e-mail ${i ? "do klienta" : "do sklepu"} nie wysłany`, { ids, err: r.reason });
      });
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Trafia do logów Vercela (Logs, ścieżka /api/zapytania).
    console.error("zgłoszenie: błąd zapisu", err);
    return NextResponse.json({ error: SERVER_ERROR }, { status: 500 });
  }
}
