import { getPublicScreenshot } from "@/lib/data";

/**
 * Stopklatka z zaznaczoną rybą, pokazywana pod filmikiem jako „Zarezerwowana” albo „Sprzedana”.
 * Gdy Marcin oznaczy rybę jako wolną albo ukryje ofertę, obrazek przestaje być dostępny.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const shot = Number.isInteger(id) ? await getPublicScreenshot(id) : undefined;
  if (!shot) return new Response("Nie ma takiej stopklatki", { status: 404 });
  return new Response(new Uint8Array(shot.data), {
    headers: { "Content-Type": shot.mime, "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff" },
  });
}
