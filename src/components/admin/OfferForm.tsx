import { type Offer, VARIETIES } from "@/lib/offers";
import { saveOfferAction } from "@/app/admin/actions";

/** Formularz dodawania i edycji oferty; bez `offer` tworzy nową. */
export function OfferForm({ offer }: { offer?: Offer }) {
  return (
    <form action={saveOfferAction} className="panel offer-form">
      {offer && <input type="hidden" name="existingId" value={offer.id} />}
      <label className="field">Tytuł<input id="title" name="title" required defaultValue={offer?.title} placeholder="Kohaku, grupa 20 ryb" /></label>
      {!offer && (
        <label className="field">Adres oferty (opcjonalnie)
          <input id="id" name="id" placeholder="np. kohaku-tosai-2025, puste = z tytułu" />
        </label>
      )}
      <div className="two">
        <label className="field">Odmiana
          <select id="variety" name="variety" defaultValue={offer?.variety ?? "Kohaku"}>
            {VARIETIES.map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label className="field">Cena za sztukę (zł)
          <input id="price" name="price" inputMode="numeric" defaultValue={offer?.price ?? ""} placeholder="puste = zapytaj o cenę" />
        </label>
      </div>
      <div className="three">
        <label className="field">Rozmiar od (cm)<input id="sizeMin" name="sizeMin" inputMode="numeric" required defaultValue={offer?.sizeCm[0]} /></label>
        <label className="field">Rozmiar do (cm)<input id="sizeMax" name="sizeMax" inputMode="numeric" required defaultValue={offer?.sizeCm[1]} /></label>
        <label className="field">Ryb na filmiku<input id="count" name="count" inputMode="numeric" required defaultValue={offer?.count} /></label>
      </div>
      <div className="two">
        <label className="field">Hodowca<input id="breeder" name="breeder" defaultValue={offer?.breeder} placeholder="Hodowla Sakai, Japonia" /></label>
        <label className="field">Wiek<input id="age" name="age" defaultValue={offer?.age} placeholder="Tosai (2024)" /></label>
      </div>
      <label className="field">Opis<textarea id="description" name="description" rows={3} defaultValue={offer?.description} /></label>
      <fieldset>
        <legend>Filmik</legend>
        <label className="field">Adres filmiku (https://…)<input id="videoUrl" name="videoUrl" defaultValue={offer?.videoUrl} placeholder="link do pliku MP4, np. z Bunny Stream" /></label>
        <div className="two">
          <label className="field">Miniatura (https://…, opcjonalnie)<input id="posterUrl" name="posterUrl" defaultValue={offer?.posterUrl} /></label>
          <label className="field">Długość<input id="videoLength" name="videoLength" defaultValue={offer?.videoLength} placeholder="1:48" /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Sprzedane</legend>
        <div className="two">
          <label className="field">Numery sprzedanych ryb<input id="sold" name="sold" defaultValue={offer?.sold.join(", ")} placeholder="np. 3, 8, 14" /></label>
          <label className="field">Sprzedane z grupy (bez numeru)<input id="groupSold" name="groupSold" inputMode="numeric" defaultValue={offer?.groupSold ?? 0} /></label>
        </div>
        <p className="muted small">Zamówienia ze sklepu uzupełniają te pola same. Zmieniaj je ręcznie tylko przy sprzedaży poza sklepem.</p>
      </fieldset>
      <label className="opt"><input type="checkbox" id="published" name="published" defaultChecked={offer?.published ?? true} /><span>Widoczna w sklepie</span></label>
      <div><button type="submit" className="btn btn--primary">{offer ? "Zapisz zmiany" : "Dodaj ofertę"}</button></div>
    </form>
  );
}
