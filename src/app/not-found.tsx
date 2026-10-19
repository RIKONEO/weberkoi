import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="wrap section flow">
        <h1 className="page-title">Tej strony nie ma w stawie</h1>
        <p className="muted">Oferta mogła zostać sprzedana albo link jest niepoprawny.</p>
        <div><Link href="/katalog" className="btn">Przejdź do katalogu</Link></div>
      </main>
    </>
  );
}
