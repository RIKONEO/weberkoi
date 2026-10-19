# WEBER Nishikigoi – sklep z koi

Sklep internetowy z karpiami koi. Każda oferta to filmik z grupą ryb jednej odmiany; klient zatrzymuje filmik, robi screenshot wybranej ryby i wysyła go w formularzu przy ofercie. Sklep sam kontaktuje się z klientem, a płatność to przelew na konto albo gotówka przy odbiorze (bez płatności online i koszyka). Ceny stałe lub „zapytaj o cenę”, wysyłka kurierem (pon–śr) albo odbiór osobisty.

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

`/admin` (hasło z `ADMIN_PASSWORD`, działa też na telefonie): zgłoszenia klientów ze screenshotami, telefonem i e-mailem; oferty z edycją, wyróżnianiem („Polecamy” na górze strony głównej i katalogu) i ukrywaniem; wstrzymanie wysyłek. Sprzedane ryby wpisuje się ręcznie w edycji oferty.

Screenshoty są zmniejszane w przeglądarce i na serwerze (JPG do 1600 px) i trzymane w bazie, w tabeli `enquiry_screenshots`. Widzi je tylko zalogowany admin.

Tabele `orders` i `order_items` zostały po dawnym koszyku ze Stripe. Sklep ich nie używa, ale zostają w bazie z historią.

## Struktura

- `src/app/page.tsx` – strona główna z animowanym stawem (`src/components/PondHero.tsx`).
- `src/lib/pond/` – staw w Three.js: ryby, woda, liście lotosu, karmienie.
- `src/app/(sklep)/` – katalog, karta oferty z formularzem zgłoszenia, strony informacyjne.
- `src/db/` – schemat bazy (Drizzle ORM), połączenie i przykładowe oferty.
- `src/lib/data.ts` – zapytania do bazy dla sklepu i panelu.
- `src/app/admin/` – panel admina; `src/middleware.ts` pilnuje logowania.
- `src/lib/enquiry.ts` – walidacja zgłoszeń po stronie serwera.
- `src/app/api/zapytania/` – przyjmowanie zgłoszeń ze screenshotami.

## Co dalej

E-mail do sklepu o nowym zgłoszeniu.
