import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__row">
        <span>WEBER Nishikigoi · Koi Fish Seller</span>
        <nav aria-label="Informacje">
          <Link href="/wysylka-i-odbior">Wysyłka i odbiór</Link>
          <Link href="/kontakt">Kontakt</Link>
          <a href="https://www.facebook.com/profile.php?id=61574920259547" target="_blank" rel="noreferrer">
            Facebook
          </a>
        </nav>
      </div>
    </footer>
  );
}
