import type { TakenFish } from "@/lib/offers";

const LABEL = { zarezerwowana: "Zarezerwowana", sprzedana: "Sprzedana" } as const;

/** Miniatury stopklatek ryb, które ktoś już wybrał, z czerwonym albo pomarańczowym stemplem. */
export function TakenThumbs({ taken, small = false }: { taken: TakenFish[]; small?: boolean }) {
  return (
    <div className={small ? "taken__grid taken__grid--sm" : "taken__grid"}>
      {taken.map((t) => (
        <a key={t.shot} href={`/stopklatka/${t.shot}`} target="_blank" rel="noreferrer" className="taken__item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/stopklatka/${t.shot}`} alt={`Ryba ${LABEL[t.fish].toLowerCase()}`} loading="lazy" />
          <span className={`taken__stamp taken__stamp--${t.fish}`}>{LABEL[t.fish]}</span>
        </a>
      ))}
    </div>
  );
}

/** Galeria pod filmikiem: żeby następny klient nie wybrał ryby, którą ktoś już kupił albo zarezerwował. */
export function TakenGallery({ taken }: { taken: TakenFish[] }) {
  if (!taken.length) return null;
  const sold = taken.filter((t) => t.fish === "sprzedana").length;
  const reserved = taken.length - sold;
  return (
    <section className="taken" aria-labelledby="taken-title">
      <h2 id="taken-title" className="taken__title">Już wybrane z tego filmiku</h2>
      <p className="muted small">
        {[sold && `Sprzedane: ${sold}`, reserved && `Zarezerwowane: ${reserved}`].filter(Boolean).join(" · ")}. Tych ryb nie
        da się już wybrać. Porównaj wzór na grzbiecie, zanim wyślesz zgłoszenie.
      </p>
      <TakenThumbs taken={taken} />
    </section>
  );
}
