import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getScreenshot } from "@/lib/data";

/** Screenshot ze zgłoszenia klienta, tylko dla zalogowanego admina. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!(await verifySessionToken(jar.get(SESSION_COOKIE)?.value))) return new Response("Brak dostępu", { status: 401 });
  const id = Number((await params).id);
  const shot = Number.isInteger(id) ? await getScreenshot(id) : undefined;
  if (!shot) return new Response("Nie ma takiego screenshota", { status: 404 });
  return new Response(new Uint8Array(shot.data), {
    headers: { "Content-Type": shot.mime, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" },
  });
}
