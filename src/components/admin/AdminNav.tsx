"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/zapytania", label: "Zgłoszenia" },
  { href: "/admin/oferty", label: "Oferty" },
  { href: "/admin/ustawienia", label: "Ustawienia" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="admin-nav" aria-label="Panel">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? "page" : undefined}>{l.label}</Link>
      ))}
      <Link href="/" target="_blank">Sklep ↗</Link>
    </nav>
  );
}
