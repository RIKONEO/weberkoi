import { getFishMapImage } from "@/lib/data";

/**
 * Klatka mapy ryb pod filmikiem oferty. Adres ma w `?v=` czas ostatniej zmiany mapy,
 * więc obrazek można długo trzymać w pamięci przeglądarki: po zmianie klatki zmienia się adres.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const img = await getFishMapImage((await params).id);
  if (!img) return new Response("Nie ma takiej mapy", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: { "Content-Type": img.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
