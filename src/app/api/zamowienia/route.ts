import { NextResponse } from "next/server";
import { parseOrder } from "@/lib/orders";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nieprawidłowe zamówienie." }, { status: 400 });
  const parsed = parseOrder(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });
  // Krok 3: zapis w bazie, rezerwacja ryb i przekierowanie do płatności (Przelewy24).
  const orderNo = `WK-${Date.now().toString(36).toUpperCase()}`;
  console.info("Nowe zamówienie", orderNo, parsed.value);
  return NextResponse.json({ ok: true, orderNo, total: parsed.value.total, delivery: parsed.value.delivery, day: parsed.value.day });
}
