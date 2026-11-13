"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "./cart/CartProvider";
import { plural } from "@/lib/offers";

const NAV = [
  { href: "/katalog", label: "Katalog" },
  { href: "/odbior", label: "Odbiór osobisty" },
  { href: "/kontakt", label: "Kontakt" },
];

/** `overlay` = przezroczysty nagłówek nad stawem na stronie głównej. */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const path = usePathname();
  const { count } = useCart();
  return (
    <header className={overlay ? "site-header site-header--overlay" : "site-header"}>
      <div className="wrap site-header__bar">
        <Link href="/" className="brand" aria-label="WEBER Nishikigoi, strona główna">
          <Image src="/logo-320.jpg" alt="" width={44} height={44} priority />
          <span>
            <b>WEBER</b>
            <small>Nishikigoi</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Główna nawigacja">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? "page" : undefined} className="nav-hide-sm">
              {n.label}
            </Link>
          ))}
          <Link href="/katalog" aria-current={path.startsWith("/katalog") ? "page" : undefined} className="nav-show-sm">
            Katalog
          </Link>
          <Link href="/kontakt" aria-current={path.startsWith("/kontakt") ? "page" : undefined} className="nav-show-sm">
            Kontakt
          </Link>
          <Link
            href="/koszyk"
            aria-current={path.startsWith("/koszyk") ? "page" : undefined}
            className="nav-cart"
            aria-label={count ? `Koszyk, ${count} ${plural(count, "ryba", "ryby", "ryb")}` : "Koszyk"}
          >
            <svg className="nav-cart__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M3 9h18l-2 11H5L3 9Zm5 0 4-6 4 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            <span className="nav-cart__label">Koszyk</span>
            {count > 0 && <span className="nav-cart__n num">{count}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
