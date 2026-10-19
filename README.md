# WEBER Nishikigoi – sklep z koi

Sklep internetowy z karpiami koi. Każda oferta to filmik z grupą ryb jednej odmiany; klient wybiera konkretną rybę po numerze albo kupuje sztukę z grupy. Ceny stałe lub „zapytaj o cenę”, wysyłka kurierem (pon–śr) albo odbiór osobisty.

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # wersja produkcyjna
npm run lint
```

Ustawienia w `.env.local` (wzór w `.env.example`): adres bazy PostgreSQL, hasło do panelu, sekret sesji i klucze Stripe.

Pierwsze uruchomienie bazy:

```bash
npm run db:migrate   # tworzy tabele (pliki w drizzle/)
npm run db:seed      # dodaje przykładowe oferty
```

Po zmianie `src/db/schema.ts`: `npm run db:generate`, a potem `npm run db:migrate`.

## Panel admina

`/admin` (hasło z `ADMIN_PASSWORD`): zamówienia ze zmianą statusu i numerem przesyłki, zapytania o cenę, oferty z adresem filmiku i sprzedanymi numerami, wstrzymanie wysyłek. Zamówienie od razu rezerwuje ryby; anulowanie je zwalnia.

## Płatności (Stripe)

Klient płaci na stronie Stripe Checkout (BLIK, karta, Przelewy24), a wraca na `/zamowienie/<nr>?k=<klucz>`. W panelu Stripe trzeba włączyć metody BLIK i Przelewy24 (Settings → Payment methods) i dodać webhook na `https://<domena>/api/stripe` ze zdarzeniami `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded` i `checkout.session.async_payment_failed`.

Ryby są zarezerwowane przez 45 minut. Jeśli klient nie zapłaci, Stripe zamyka płatność, a zamówienie anuluje się samo i zwalnia ryby. Wpłata zmienia status na „Opłacone”. Zwroty robi się w panelu Stripe.

Do testów lokalnych: `stripe listen --forward-to localhost:3000/api/stripe` (Stripe CLI) podaje sekret webhooka dla kluczy testowych.

## Struktura

- `src/app/page.tsx` – strona główna z animowanym stawem (`src/components/PondHero.tsx`).
- `src/lib/pond/` – staw w Three.js: ryby, woda, liście lotosu, karmienie.
- `src/app/(sklep)/` – katalog, karta oferty, koszyk, kasa, strony informacyjne.
- `src/db/` – schemat bazy (Drizzle ORM), połączenie i przykładowe oferty.
- `src/lib/data.ts` – zapytania do bazy dla sklepu i panelu.
- `src/app/admin/` – panel admina; `src/middleware.ts` pilnuje logowania.
- `src/lib/orders.ts` – walidacja zamówień i zapytań po stronie serwera.
- `src/app/api/` – przyjmowanie zamówień i zapytań o cenę, webhook Stripe.
- `src/lib/stripe.ts` – tworzenie płatności w Stripe Checkout.

## Co dalej

E-maile do klientów i sklepu, wdrożenie na serwer.
