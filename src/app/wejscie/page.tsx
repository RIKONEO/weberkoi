import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SITE_LOCKED, safeNext } from "@/lib/site-lock";
import { enterSite } from "./actions";

export const metadata: Metadata = { title: "Strona w przygotowaniu", robots: { index: false, follow: false } };

export default async function LockPage({ searchParams }: { searchParams: Promise<{ blad?: string; dalej?: string }> }) {
  const { blad, dalej } = await searchParams;
  if (!SITE_LOCKED) redirect(safeNext(dalej));
  return (
    <main className="wrap section">
      <form action={enterSite} className="panel login">
        <Image src="/logo-320.jpg" alt="" width={64} height={64} className="login__logo" />
        <h1>WEBER Nishikigoi</h1>
        <p className="muted" style={{ textAlign: "center" }}>Strona jest w przygotowaniu. Wejście tylko z hasłem.</p>
        <input type="hidden" name="dalej" value={safeNext(dalej)} />
        <label className="field">
          Hasło
          <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" />
        </label>
        {blad && <p className="notice notice--error" role="alert">Nieprawidłowe hasło.</p>}
        <button type="submit" className="btn btn--primary">Wejdź</button>
      </form>
    </main>
  );
}
