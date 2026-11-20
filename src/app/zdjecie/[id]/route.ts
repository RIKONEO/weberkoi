import { getOfferPhoto } from "@/lib/data";

/** Zdjęcie produktu wgrane w panelu (np. obrazu z metalu). Adres się nie zmienia, więc cache na długo. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response("Nie ma takiego zdjęcia", { status: 404 });
  const img = await getOfferPhoto(id);
  if (!img) return new Response("Nie ma takiego zdjęcia", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: { "Content-Type": img.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
