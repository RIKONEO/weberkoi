# WEBER Nishikigoi – sklep z koi

Sklep internetowy z karpiami koi. Każda oferta to filmik z grupą ryb jednej odmiany; klient wybiera konkretną rybę po numerze albo kupuje sztukę z grupy. Ceny stałe lub „zapytaj o cenę”, wysyłka kurierem (pon–śr) albo odbiór osobisty.

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # wersja produkcyjna
npm run lint
```

Ustawienia w `.env.local` (wzór w `.env.example`).

## Struktura

- `src/app/page.tsx` – strona główna z animowanym stawem (`src/components/PondHero.tsx`).
- `src/lib/pond/` – staw w Three.js: ryby, woda, liście lotosu, karmienie.
- `src/app/(sklep)/` – katalog, karta oferty, koszyk, kasa, strony informacyjne.
- `src/lib/offers.ts` – oferty (na razie przykładowe dane w kodzie).
- `src/lib/orders.ts` – walidacja zamówień i zapytań po stronie serwera.
- `src/app/api/` – przyjmowanie zamówień i zapytań o cenę.

## Co dalej (krok 3)

Baza danych i panel admina (oferty z filmikami, zamówienia, zapytania), płatności Przelewy24, e-maile do klientów, rezerwacja ryb.
