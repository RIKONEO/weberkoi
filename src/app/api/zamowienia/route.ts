import { NextResponse } from "next/server";
import { createOrder } from "@/lib/data";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nieprawidłowe zamówienie." }, { status: 400 });
  const res = await createOrder(body);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 });
  // Następny krok: przekierowanie do bramki płatności i e-mail z potwierdzeniem.
  return NextResponse.json({ ok: true, orderNo: res.no, total: res.order.total, delivery: res.order.delivery, day: res.order.day });
}
