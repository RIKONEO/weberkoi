import Link from "next/link";
import { CONTACT } from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__row">
        <span>WEBER Nishikigoi · Koi Fish Seller</span>
        <nav aria-label="Informacje">
          <Link href="/odbior">Odbiór osobisty</Link>
          <Link href="/kontakt">Kontakt</Link>
          <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <a href={CONTACT.facebook} target="_blank" rel="noreferrer">
            Facebook
          </a>
        </nav>
      </div>
    </footer>
  );
}
