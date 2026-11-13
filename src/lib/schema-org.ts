// Dane strukturalne schema.org: sklep jako lokalna firma i oferty jako produkty.
import { CONTACT } from "./contact";
import { type Offer, available } from "./offers";
import { SITE_NAME, SITE_URL } from "./site";

const abs = (path: string) => new URL(path, SITE_URL).toString();

export function storeSchema() {
  const [postalCode, ...town] = CONTACT.city.split(" ");
  return {
    "@context": "https://schema.org",
    "@type": "PetStore",
    "@id": abs("/#sklep"),
    name: SITE_NAME,
    description: "Karpie koi z Japonii i z naszej hodowli. Każda ryba na filmiku, odbiór osobisty w Zakrzewie.",
    url: abs("/"),
    logo: abs("/logo-320.jpg"),
    image: abs("/opengraph-image"),
    telephone: CONTACT.phoneHref.replace("tel:", ""),
    email: CONTACT.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT.street,
      postalCode,
      addressLocality: town.join(" "),
      addressCountry: "PL",
    },
    sameAs: [CONTACT.facebook],
  };
}

export function offerSchema(o: Offer) {
  const left = available(o);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: o.title,
    description: o.description || `${o.variety}, ${o.sizeCm[0]}–${o.sizeCm[1]} cm, ${o.age}.`,
    category: `Karpie koi / ${o.variety}`,
    url: abs(`/oferta/${o.id}`),
    ...(o.posterUrl ? { image: [o.posterUrl] } : {}),
    brand: { "@type": "Brand", name: o.breeder || SITE_NAME },
    // Cena za sztukę; gdy „zapytaj o cenę”, Google dostaje produkt bez oferty.
    ...(o.price
      ? {
          offers: {
            "@type": "Offer",
            price: o.price,
            priceCurrency: "PLN",
            availability: left > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
            inventoryLevel: { "@type": "QuantitativeValue", value: left },
            itemCondition: "https://schema.org/NewCondition",
            url: abs(`/oferta/${o.id}`),
            seller: { "@id": abs("/#sklep") },
            availableDeliveryMethod: "https://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
          },
        }
      : {}),
  };
}
