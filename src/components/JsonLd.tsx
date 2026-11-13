/** Dane strukturalne schema.org dla Google (sklep, oferty). Znak „<” zamieniony, żeby tekst nie zamknął skryptu. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
