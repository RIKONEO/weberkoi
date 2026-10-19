import { NextResponse } from "next/server";
import { parseEnquiry } from "@/lib/orders";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nieprawidłowe zapytanie." }, { status: 400 });
  const parsed = parseEnquiry(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });
  // Krok 3: zapis w bazie, rezerwacja ryb na 24 h i e-mail do sklepu.
  console.info("Nowe zapytanie o cenę", parsed.value);
  return NextResponse.json({ ok: true });
}
