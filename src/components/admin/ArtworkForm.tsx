import type { Offer } from "@/lib/offers";
import { saveArtworkAction } from "@/app/admin/actions";
import { MAX_ART_PHOTOS } from "@/lib/offerForm";
import { PhotosField } from "./PhotosField";

/** Formularz obrazu z metalu (dział Koi Light Art); bez `offer` dodaje nowy. */
export function ArtworkForm({ offer }: { offer?: Offer }) {
  return (
    <form action={saveArtworkAction} className="panel offer-form">
      {offer && <input type="hidden" name="existingId" value={offer.id} />}
      <label className="field">Nazwa obrazu<input id="title" name="title" required defaultValue={offer?.title} placeholder="np. Asagi" /></label>
      {!offer && (
        <label className="field">Adres w sklepie (opcjonalnie)
          <input id="id" name="id" placeholder="puste = z nazwy, np. obraz-asagi" />
        </label>
      )}
      <div className="two">
        <label className="field">Cena (zł)
          <input id="price" name="price" inputMode="numeric" defaultValue={offer?.price ?? ""} placeholder="puste = cena na zapytanie" />
        </label>
        <label className="field">Wymiary
          <input id="dimensions" name="dimensions" defaultValue={offer?.dimensions} placeholder="np. 50 × 100 cm" />
        </label>
      </div>
      <div className="two">
        <label className="field">Sztuk do sprzedania
          <input id="count" name="count" inputMode="numeric" required defaultValue={offer?.count ?? 1} />
        </label>
        <label className="field">Już sprzedanych
          <input id="groupSold" name="groupSold" inputMode="numeric" defaultValue={offer?.groupSold ?? 0} />
        </label>
      </div>
      <p className="muted small">Gdy sprzedanych jest tyle, ile sztuk, obraz pokazuje się jako wyprzedany. „Sprzedana” przy zgłoszeniu w panelu sama zwiększa liczbę sprzedanych.</p>
      <label className="field">Opis<textarea id="description" name="description" rows={5} defaultValue={offer?.description} /></label>
      <PhotosField initial={offer?.photos ?? []} offerId={offer?.id} max={MAX_ART_PHOTOS} />
      <label className="opt"><input type="checkbox" id="published" name="published" defaultChecked={offer?.published ?? true} /><span>Widoczny w sklepie</span></label>
      <label className="opt"><input type="checkbox" id="featured" name="featured" defaultChecked={offer?.featured ?? false} /><span>Wyróżniony<small>Pokazujemy go na początku działu z etykietą „Polecamy”.</small></span></label>
      <div><button type="submit" className="btn btn--primary">{offer ? "Zapisz zmiany" : "Dodaj obraz"}</button></div>
    </form>
  );
}
