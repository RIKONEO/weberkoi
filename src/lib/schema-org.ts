// Dane strukturalne schema.org: sklep jako lokalna firma i oferty jako produkty.
import { CONTACT } from "./contact";
import { type Offer, available, offerPath } from "./offers";
import { SITE_NAME, SITE_URL } from "./site";

const abs = (path: string) => new URL(path, SITE_URL).toString();

export function storeSchema() {
  const [postalCode, ...town] = CONTACT.city.split(" ");
  return {
    "@context": "https://schema.org",
    "@type": "PetStore",
    "@id": abs("/#sklep"),
    name: SITE_NAME,
    alternateName: ["WEBER KOI", "Weber Koi", "WEBER Nishikigoi sklep z koi"],
    description: "Sklep z karpiami koi: koi z Japonii i z naszej hodowli. Każda ryba na filmiku, odbiór osobisty w Zakrzewie.",
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
      addressRegion: "wielkopolskie",
      addressCountry: "PL",
    },
    areaServed: { "@type": "Country", name: "Polska" },
    currenciesAccepted: "PLN",
    paymentAccepted: "Gotówka, przelew bankowy",
    knowsAbout: ["karpie koi", "nishikigoi", "Kohaku", "Showa", "Taisho Sanke", "Ogon", "Chagoi", "obrazy z koi ze stali"],
    sameAs: [CONTACT.facebook],
  };
}

/** Strona jako całość (nazwa sklepu w wynikach Google). */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": abs("/#strona"),
    name: SITE_NAME,
    alternateName: "WEBER KOI",
    url: abs("/"),
    inLanguage: "pl-PL",
    publisher: { "@id": abs("/#sklep") },
  };
}

/** Okruszki (Strona główna › …) pod wynikiem w Google. Strona główna dodawana sama. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  const all = [{ name: "Strona główna", path: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function offerSchema(o: Offer) {
  const left = available(o);
  const art = o.kind === "obraz";
  const url = abs(offerPath(o));
  const images = art ? o.photos : o.posterUrl ? [o.posterUrl] : [];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: art || /koi/i.test(o.title) ? o.title : `Koi ${o.title}`,
    description: o.description || (art ? `Obraz z koi ze stali cięty laserem.` : `Karp koi ${o.variety}, ${o.sizeCm[0]}–${o.sizeCm[1]} cm, ${o.age}.`),
    category: art ? "Obrazy ze stali z motywem koi" : `Karpie koi / ${o.variety}`,
    url,
    ...(images.length ? { image: images } : {}),
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
            url,
            seller: { "@id": abs("/#sklep") },
            availableDeliveryMethod: "https://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
          },
        }
      : {}),
  };
}
