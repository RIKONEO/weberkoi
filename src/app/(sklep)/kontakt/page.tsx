import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kontakt" };

export default function ContactPage() {
  return (
    <div className="wrap section flow prose">
      <h1 className="page-title">Kontakt</h1>
      <p>Masz pytanie o konkretną rybę albo chcesz przyjechać obejrzeć stawy? Napisz do nas na Facebooku albo mailem.</p>
      <dl className="specs">
        <dt>Facebook</dt>
        <dd>
          <a href="https://www.facebook.com/profile.php?id=61574920259547" target="_blank" rel="noreferrer">WEBER Nishikigoi</a>
        </dd>
        <dt>E-mail</dt>
        <dd>kontakt@example.com</dd>
        <dt>Adres</dt>
        <dd>ul. Przykładowa 12, Weberowo</dd>
      </dl>
      <p className="notice notice--warn">E-mail i adres są przykładowe. Uzupełnimy je Waszymi danymi.</p>
    </div>
  );
}
