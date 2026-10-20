import type { Metadata } from "next";
import { ScrollKoi } from "@/components/animated/ScrollKoi";

// Wersja poglądowa: strona nie jest linkowana z menu i nie trafia do wyszukiwarek.
export const metadata: Metadata = {
  title: "Animacja na scrollu (podgląd)",
  robots: { index: false, follow: false },
};

export default async function AnimatedPreview({ searchParams }: { searchParams: Promise<{ kierunek?: string }> }) {
  const { kierunek } = await searchParams;
  const direction = kierunek === "pion" ? "pion" : kierunek === "poziom" ? "poziom" : "auto";
  return <ScrollKoi direction={direction} />;
}
