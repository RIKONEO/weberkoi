import type { Metadata } from "next";
import Image from "next/image";
import { login } from "../actions";

export const metadata: Metadata = { title: "Logowanie do panelu", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ blad?: string }> }) {
  const { blad } = await searchParams;
  return (
    <main className="wrap section">
      <form action={login} className="panel login">
        <Image src="/logo-320.jpg" alt="" width={64} height={64} className="login__logo" />
        <h1>Panel WEBER</h1>
        <label className="field">
          Hasło
          <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" />
        </label>
        {blad && <p className="notice notice--error" role="alert">{blad}</p>}
        <button type="submit" className="btn btn--primary">Zaloguj</button>
      </form>
    </main>
  );
}
