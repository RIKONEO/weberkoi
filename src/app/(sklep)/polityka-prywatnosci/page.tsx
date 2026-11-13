import type { Metadata } from "next";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  alternates: { canonical: "/polityka-prywatnosci" },
  description: "Jakie dane zbieramy w zgłoszeniu „Chcę tę rybę”, po co, jak długo je trzymamy i jakie masz prawa (RODO).",
};

export default function PrivacyPage() {
  const email = <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>;
  return (
    <div className="wrap section flow prose">
      <h1 className="page-title">Polityka prywatności</h1>
      <p>Tu wyjaśniamy prosto, co dzieje się z danymi, które podajesz w zgłoszeniu „Chcę tę rybę”, i jakie masz prawa według RODO.</p>

      <h2>Kto przetwarza Twoje dane</h2>
      <p>
        Administratorem danych jest {CONTACT.owner}, {CONTACT.street}, {CONTACT.city}. Kontakt w sprawie danych: {email} albo{" "}
        <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>.
      </p>

      <h2>Jakie dane zbieramy</h2>
      <p>
        W zgłoszeniu podajesz imię, telefon albo e-mail, opcjonalnie wiadomość, oraz stopklatkę lub screenshot z naszego filmiku z zaznaczoną
        rybą. Zapisujemy też datę zgłoszenia. Nie prosimy o adres ani dane do płatności.
      </p>

      <h2>Po co i na jakiej podstawie</h2>
      <p>
        Dane są nam potrzebne, żeby odpowiedzieć na zgłoszenie, potwierdzić rybę, umówić odbiór i sprzedać rybę (art. 6 ust. 1 lit. b RODO,
        działania przed zawarciem umowy i jej wykonanie). Jeśli dojdzie do sprzedaży, przechowujemy dane potrzebne do rozliczeń, bo wymagają
        tego przepisy podatkowe (art. 6 ust. 1 lit. c RODO). Podanie danych jest dobrowolne, ale bez telefonu albo e-maila nie mamy jak Ci odpisać.
      </p>

      <h2>Stopklatka pod filmikiem</h2>
      <p>
        Stopklatka z Twojego zgłoszenia może pojawić się pod filmikiem oferty jako ryba „zarezerwowana” albo „sprzedana”, żeby inni klienci
        widzieli, które ryby są już zajęte. Pokazujemy sam obrazek, bez imienia i danych kontaktowych. Jeśli nie chcesz, żeby się pokazywał,
        napisz do nas, a usuniemy go.
      </p>

      <h2>Jak długo</h2>
      <p>
        Zgłoszenia trzymamy do 12 miesięcy od ostatniego kontaktu. Jeśli kupisz rybę, dane potrzebne do rozliczeń przechowujemy przez okres
        wymagany przepisami podatkowymi, zwykle 5 lat od końca roku sprzedaży. Na Twoją prośbę usuwamy zgłoszenie wcześniej, o ile przepisy
        nie każą nam go zachować.
      </p>

      <h2>Kto jeszcze ma dostęp</h2>
      <p>
        Dane widzi tylko sprzedawca. Technicznie przechowują je firmy, które obsługują stronę na nasze zlecenie: hosting strony (Vercel), baza
        danych (Neon) i serwer filmików (Bunny.net). Część z nich działa poza Europejskim Obszarem Gospodarczym; wtedy dane są chronione
        standardowymi klauzulami umownymi zatwierdzonymi przez Komisję Europejską. Nie sprzedajemy danych i nie używamy ich do reklam.
      </p>

      <h2>Twoje prawa</h2>
      <p>
        Masz prawo do dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia oraz do sprzeciwu.
        Wystarczy napisać na {email}. Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).
      </p>

      <h2>Pliki cookies</h2>
      <p>
        Strona nie używa cookies reklamowych ani statystyk. Jedyne cookie służy do logowania sprzedawcy do panelu. Przeglądarka pobiera
        filmiki z serwera Bunny.net, który jak każdy serwer widzi adres IP urządzenia.
      </p>
    </div>
  );
}
