# WEBER Nishikigoi – sklep z koi

Sklep internetowy z karpiami koi. Każda oferta to filmik z grupą ryb jednej odmiany; klient wybiera konkretną rybę po numerze albo kupuje sztukę z grupy. Ceny stałe lub „zapytaj o cenę”, wysyłka kurierem (pon–śr) albo odbiór osobisty.

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # wersja produkcyjna
npm run lint
```

Ustawienia w `.env.local` (wzór w `.env.example`): adres bazy PostgreSQL, hasło do panelu i sekret sesji.

Pierwsze uruchomienie bazy:

```bash
npm run db:migrate   # tworzy tabele (pliki w drizzle/)
npm run db:seed      # dodaje przykładowe oferty
```

Po zmianie `src/db/schema.ts`: `npm run db:generate`, a potem `npm run db:migrate`.

## Panel admina

`/admin` (hasło z `ADMIN_PASSWORD`): zamówienia ze zmianą statusu i numerem przesyłki, zapytania o cenę, oferty z adresem filmiku i sprzedanymi numerami, wstrzymanie wysyłek. Zamówienie od razu rezerwuje ryby; anulowanie je zwalnia.

## Struktura

- `src/app/page.tsx` – strona główna z animowanym stawem (`src/components/PondHero.tsx`).
- `src/lib/pond/` – staw w Three.js: ryby, woda, liście lotosu, karmienie.
- `src/app/(sklep)/` – katalog, karta oferty, koszyk, kasa, strony informacyjne.
- `src/db/` – schemat bazy (Drizzle ORM), połączenie i przykładowe oferty.
- `src/lib/data.ts` – zapytania do bazy dla sklepu i panelu.
- `src/app/admin/` – panel admina; `src/middleware.ts` pilnuje logowania.
- `src/lib/orders.ts` – walidacja zamówień i zapytań po stronie serwera.
- `src/app/api/` – przyjmowanie zamówień i zapytań o cenę.

## Co dalej

Płatności online, e-maile do klientów i sklepu, zwalnianie rezerwacji nieopłaconych zamówień.
