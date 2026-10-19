// Dostęp do bazy dla sklepu i panelu. Tylko po stronie serwera.
import "server-only";
import { and, desc, eq, inArray, sql as dsql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Offer, Variety } from "./offers";
import { type Enquiry, type Order, parseOrder } from "./orders";

const { offers, orders, orderItems, enquiries, settings } = schema;
type OfferRow = typeof offers.$inferSelect;

/** Tablica liczb jako literał Postgresa ('{4,5}'), bo Drizzle rozwija tablice JS w krotki. */
const intArray = (nums: number[]) => `{${nums.map((n) => Math.trunc(n)).join(",")}}`;

function toOffer(r: OfferRow): Offer {
  return {
    id: r.id,
    variety: r.variety as Variety,
    title: r.title,
    breeder: r.breeder,
    age: r.age,
    sizeCm: [r.sizeMin, r.sizeMax],
    count: r.count,
    sold: [...r.sold].sort((a, b) => a - b),
    groupSold: r.groupSold,
    price: r.price,
    videoUrl: r.videoUrl ?? undefined,
    posterUrl: r.posterUrl ?? undefined,
    videoLength: r.videoLength ?? undefined,
    description: r.description,
    published: r.published,
    addedAt: r.addedAt.toISOString(),
  };
}

export async function listOffers({ includeHidden = false } = {}): Promise<Offer[]> {
  const rows = await db.select().from(offers).where(includeHidden ? undefined : eq(offers.published, true)).orderBy(desc(offers.addedAt));
  return rows.map(toOffer);
}

export async function getOffer(id: string, { includeHidden = false } = {}): Promise<Offer | undefined> {
  const [r] = await db.select().from(offers).where(eq(offers.id, id));
  return r && (includeHidden || r.published) ? toOffer(r) : undefined;
}

export async function getShippingPaused(): Promise<boolean> {
  const [r] = await db.select().from(settings).where(eq(settings.key, "shippingPaused"));
  return r?.value === true;
}

export async function setShippingPaused(on: boolean) {
  await db.insert(settings).values({ key: "shippingPaused", value: on }).onConflictDoUpdate({ target: settings.key, set: { value: on } });
}

/**
 * Zapisuje zamówienie i od razu rezerwuje ryby. Oferty są blokowane na czas transakcji,
 * więc dwie osoby nie kupią tej samej ryby jednocześnie.
 */
export async function createOrder(body: Record<string, unknown>): Promise<{ ok: true; order: Order; no: string } | { ok: false; error: string }> {
  const ids = Array.isArray(body.lines) ? [...new Set((body.lines as { offerId?: unknown }[]).map((l) => String(l?.offerId ?? "")))] : [];
  const shippingPaused = await getShippingPaused();
  return db.transaction(async (tx) => {
    const rows = ids.length ? await tx.select().from(offers).where(and(inArray(offers.id, ids), eq(offers.published, true))).for("update") : [];
    const byId = new Map(rows.map((r) => [r.id, toOffer(r)]));
    const parsed = parseOrder(body, { findOffer: (id) => byId.get(id), shippingPaused });
    if (!parsed.ok) return parsed;
    const order = parsed.value;
    for (const l of order.lines) {
      if (l.picks) await tx.update(offers).set({ sold: dsql`array_cat(${offers.sold}, ${intArray(l.picks)}::int[])` }).where(eq(offers.id, l.offerId));
      else await tx.update(offers).set({ groupSold: dsql`${offers.groupSold} + ${l.qty}` }).where(eq(offers.id, l.offerId));
    }
    const no = `WK-${Date.now().toString(36).toUpperCase()}`;
    const [row] = await tx
      .insert(orders)
      .values({ no, ...order.customer, delivery: order.delivery, day: order.day, payment: order.payment, itemsTotal: order.itemsTotal, deliveryPrice: order.deliveryPrice, total: order.total })
      .returning({ id: orders.id });
    await tx.insert(orderItems).values(order.lines.map((l) => ({ orderId: row.id, offerId: l.offerId, title: l.title, qty: l.qty, picks: l.picks, unitPrice: l.unitPrice })));
    return { ok: true as const, order, no };
  });
}

export async function createEnquiry(e: Enquiry) {
  await db.insert(enquiries).values(e);
}

// --- panel admina ---

export const ORDER_STATUSES = {
  nowe: "Nowe",
  oplacone: "Opłacone",
  pakowane: "Pakowane",
  wyslane: "Wysłane",
  "do-odbioru": "Gotowe do odbioru",
  zakonczone: "Zakończone",
  anulowane: "Anulowane",
} as const;
export type OrderStatus = keyof typeof ORDER_STATUSES;

export const ENQUIRY_STATUSES = { nowe: "Nowe", odpowiedziano: "Wysłano cenę", zamkniete: "Zamknięte" } as const;
export type EnquiryStatus = keyof typeof ENQUIRY_STATUSES;

export async function listOrders(status?: string) {
  return db.select().from(orders).where(status ? eq(orders.status, status) : undefined).orderBy(desc(orders.createdAt));
}

export async function getOrderWithItems(no: string) {
  const [order] = await db.select().from(orders).where(eq(orders.no, no));
  if (!order) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { ...order, items };
}

export async function updateOrder(no: string, patch: { status?: OrderStatus; trackingNo?: string | null; note?: string | null }) {
  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.no, no)).for("update");
    if (!order) return;
    // Anulowanie zwalnia zarezerwowane ryby; przywrócenie z anulowanych rezerwuje je ponownie.
    const cancelling = patch.status === "anulowane" && order.status !== "anulowane";
    const restoring = patch.status && patch.status !== "anulowane" && order.status === "anulowane";
    if (cancelling || restoring) {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      for (const it of items) {
        if (it.picks?.length) {
          const set = cancelling
            ? { sold: dsql`array(select unnest(${offers.sold}) except select unnest(${intArray(it.picks)}::int[]))` }
            : { sold: dsql`array_cat(${offers.sold}, ${intArray(it.picks)}::int[])` };
          await tx.update(offers).set(set).where(eq(offers.id, it.offerId));
        } else {
          const delta = cancelling ? -it.qty : it.qty;
          await tx.update(offers).set({ groupSold: dsql`greatest(0, ${offers.groupSold} + ${delta})` }).where(eq(offers.id, it.offerId));
        }
      }
    }
    await tx.update(orders).set(patch).where(eq(orders.id, order.id));
  });
}

export async function listEnquiries() {
  return db
    .select({ e: enquiries, offerTitle: offers.title })
    .from(enquiries)
    .leftJoin(offers, eq(offers.id, enquiries.offerId))
    .orderBy(desc(enquiries.createdAt));
}

export async function setEnquiryStatus(id: number, status: EnquiryStatus) {
  await db.update(enquiries).set({ status }).where(eq(enquiries.id, id));
}

export type OfferInput = Omit<typeof offers.$inferInsert, "addedAt">;

export async function saveOffer(input: OfferInput, existingId?: string) {
  if (existingId) await db.update(offers).set(input).where(eq(offers.id, existingId));
  else await db.insert(offers).values(input);
}

export async function offerHasOrders(id: string) {
  const [r] = await db.select({ n: dsql<number>`count(*)::int` }).from(orderItems).where(eq(orderItems.offerId, id));
  return (r?.n ?? 0) > 0;
}

export async function deleteOffer(id: string) {
  await db.transaction(async (tx) => {
    await tx.delete(enquiries).where(eq(enquiries.offerId, id));
    await tx.delete(offers).where(eq(offers.id, id));
  });
}

export async function dashboardCounts() {
  const [o] = await db.select({ n: dsql<number>`count(*)::int` }).from(orders).where(inArray(orders.status, ["nowe", "oplacone", "pakowane"]));
  const [e] = await db.select({ n: dsql<number>`count(*)::int` }).from(enquiries).where(eq(enquiries.status, "nowe"));
  const [f] = await db.select({ n: dsql<number>`count(*)::int` }).from(offers).where(eq(offers.published, true));
  return { openOrders: o.n, newEnquiries: e.n, liveOffers: f.n };
}
