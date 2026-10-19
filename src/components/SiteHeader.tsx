"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/katalog", label: "Katalog" },
  { href: "/wysylka-i-odbior", label: "Wysyłka i odbiór" },
  { href: "/kontakt", label: "Kontakt" },
];

/** `overlay` = przezroczysty nagłówek nad stawem na stronie głównej. */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const path = usePathname();
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
        </nav>
      </div>
    </header>
  );
}
