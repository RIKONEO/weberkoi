import type { Metadata } from "next";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = { title: "Kontakt" };

export default function ContactPage() {
  return (
    <div className="wrap section flow prose">
      <h1 className="page-title">Kontakt</h1>
      <p>Masz pytanie o konkretną rybę albo chcesz przyjechać obejrzeć stawy? Zadzwoń, napisz SMS-a, maila albo wiadomość na Facebooku.</p>
      <dl className="specs">
        <dt>Telefon</dt>
        <dd>
          <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> ({CONTACT.person})
        </dd>
        <dt>E-mail</dt>
        <dd>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </dd>
        <dt>Facebook</dt>
        <dd>
          <a href={CONTACT.facebook} target="_blank" rel="noreferrer">WEBER Nishikigoi</a>
        </dd>
        <dt>Adres</dt>
        <dd>
          {CONTACT.street}, {CONTACT.city}
        </dd>
      </dl>
      <p className="muted">Przed przyjazdem zadzwoń, żebyśmy mogli umówić godzinę.</p>
    </div>
  );
}
