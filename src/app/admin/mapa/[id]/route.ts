import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { deleteFishMap, getFishMap, getFishMapImage, getOffer, saveFishMap } from "@/lib/data";
import { normalizeImage } from "@/lib/image";
import type { MapMarker } from "@/lib/offers";

type Ctx = { params: Promise<{ id: string }> };

/** Najwięcej ryb na jednej mapie. */
const MAX_MARKERS = 200;

async function isAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

function parseMarkers(raw: unknown): MapMarker[] | null {
  if (typeof raw !== "string") return null;
  let list: unknown;
  try {
    list = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(list) || list.length > MAX_MARKERS) return null;
  const out: MapMarker[] = [];
  const seen = new Set<number>();
  for (const m of list) {
    const { n, x, y } = (m ?? {}) as Record<string, unknown>;
    if (!Number.isInteger(n) || (n as number) < 1 || (n as number) > 999 || seen.has(n as number)) return null;
    if (typeof x !== "number" || typeof y !== "number" || !(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return null;
    seen.add(n as number);
    out.push({ n: n as number, x: Math.round(x * 10000) / 10000, y: Math.round(y * 10000) / 10000 });
  }
  return out;
}

/** Klatka mapy w panelu (także dla ukrytych ofert). */
export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return new Response("Brak dostępu", { status: 401 });
  const img = await getFishMapImage((await params).id, { includeHidden: true });
  if (!img) return new Response("Nie ma takiej mapy", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: { "Content-Type": img.mime, "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}

/** Zapis mapy z panelu: `image` (nowa klatka, opcjonalnie), `markers` (JSON), `setCount` ("1"). */
export async function POST(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return fail("Zaloguj się ponownie do panelu.", 401);
  const id = (await params).id;
  if (!(await getOffer(id, { includeHidden: true }))) return fail("Nie ma takiej oferty.", 404);
  const form = await req.formData().catch(() => null);
  if (!form) return fail("Nieprawidłowe dane.");
  const markers = parseMarkers(form.get("markers"));
  if (!markers) return fail("Nieprawidłowe znaczniki ryb.");

  const file = form.get("image");
  let image: { mime: string; data: Buffer; width: number; height: number } | undefined;
  if (file && typeof file === "object" && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) return fail("Zdjęcie jest za duże (najwyżej 8 MB).");
    const clean = await normalizeImage(file, 1600, "mapa ryb");
    if (!clean) return fail("Nie udało się odczytać zdjęcia. Spróbuj z innym plikiem.");
    // Bez sharp nie znamy wymiarów z serwera, więc bierzemy te z przeglądarki.
    const width = clean.width ?? Number(form.get("width"));
    const height = clean.height ?? Number(form.get("height"));
    if (!(width > 0 && height > 0)) return fail("Nie udało się odczytać wymiarów zdjęcia.");
    image = { mime: clean.mime, data: clean.data, width, height };
  } else if (!(await getFishMap(id, { includeHidden: true }))) {
    return fail("Najpierw wybierz klatkę z filmiku albo wgraj zdjęcie.");
  }

  await saveFishMap(id, { image, markers, setCount: form.get("setCount") === "1" });
  revalidatePath(`/oferta/${id}`);
  revalidatePath("/", "layout");
  const map = await getFishMap(id, { includeHidden: true });
  return NextResponse.json({ ok: true, map });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return fail("Zaloguj się ponownie do panelu.", 401);
  const id = (await params).id;
  await deleteFishMap(id);
  revalidatePath(`/oferta/${id}`);
  return NextResponse.json({ ok: true });
}
