// Dostęp do bazy dla sklepu i panelu. Tylko po stronie serwera.
import "server-only";
import { desc, eq, gte, inArray, sql as dsql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Offer, Variety } from "./offers";
import type { Enquiry } from "./enquiry";

const { offers, orderItems, enquiries, enquiryScreenshots, settings } = schema;
type OfferRow = typeof offers.$inferSelect;

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
    featured: r.featured,
    addedAt: r.addedAt.toISOString(),
  };
}

export async function listOffers({ includeHidden = false } = {}): Promise<Offer[]> {
  const rows = await db.select().from(offers).where(includeHidden ? undefined : eq(offers.published, true)).orderBy(desc(offers.featured), desc(offers.addedAt));
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

export async function createEnquiry(e: Enquiry, screenshots: { mime: string; data: Buffer }[]) {
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(enquiries).values({ ...e, picks: null }).returning({ id: enquiries.id });
    if (screenshots.length) await tx.insert(enquiryScreenshots).values(screenshots.map((s) => ({ enquiryId: row.id, ...s })));
    return row.id;
  });
}

// --- panel admina ---

export const ENQUIRY_STATUSES = { nowe: "Nowe", odpowiedziano: "Odpisaliśmy", zamkniete: "Zamknięte" } as const;
export type EnquiryStatus = keyof typeof ENQUIRY_STATUSES;

export async function listEnquiries(status?: EnquiryStatus) {
  const rows = await db
    .select({ e: enquiries, offerTitle: offers.title })
    .from(enquiries)
    .leftJoin(offers, eq(offers.id, enquiries.offerId))
    .where(status ? eq(enquiries.status, status) : undefined)
    .orderBy(desc(enquiries.createdAt));
  const ids = rows.map((r) => r.e.id);
  const shots = ids.length
    ? await db.select({ id: enquiryScreenshots.id, enquiryId: enquiryScreenshots.enquiryId }).from(enquiryScreenshots).where(inArray(enquiryScreenshots.enquiryId, ids))
    : [];
  return rows.map((r) => ({ ...r, screenshots: shots.filter((s) => s.enquiryId === r.e.id).map((s) => s.id) }));
}

export async function getScreenshot(id: number) {
  const [r] = await db.select({ mime: enquiryScreenshots.mime, data: enquiryScreenshots.data }).from(enquiryScreenshots).where(eq(enquiryScreenshots.id, id));
  return r;
}

export async function setEnquiryStatus(id: number, status: EnquiryStatus) {
  await db.update(enquiries).set({ status }).where(eq(enquiries.id, id));
}

export type OfferInput = Omit<typeof offers.$inferInsert, "addedAt">;

export async function saveOffer(input: OfferInput, existingId?: string) {
  if (existingId) await db.update(offers).set(input).where(eq(offers.id, existingId));
  else await db.insert(offers).values(input);
}

export async function setOfferFlag(id: string, flag: "featured" | "published", on: boolean) {
  await db.update(offers).set({ [flag]: on }).where(eq(offers.id, id));
}

/** Dawne zamówienia ze sklepu wskazują na ofertę, więc takiej oferty nie da się usunąć z bazy. */
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

/** Wszystko do pulpitu panelu: zgłoszenia z ostatnich dni i stan ofert. */
export async function dashboardData(days = 14) {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const [byStatus, perDay, latest, all] = await Promise.all([
    db.select({ status: enquiries.status, n: dsql<number>`count(*)::int` }).from(enquiries).groupBy(enquiries.status),
    db
      .select({ day: dsql<string>`to_char(${enquiries.createdAt} at time zone 'Europe/Warsaw', 'YYYY-MM-DD')`, n: dsql<number>`count(*)::int` })
      .from(enquiries)
      .where(gte(enquiries.createdAt, since))
      .groupBy(dsql`1`),
    listEnquiries().then((rows) => rows.slice(0, 5)),
    listOffers({ includeHidden: true }),
  ]);
  const status = Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Partial<Record<EnquiryStatus, number>>;
  const counts = new Map(perDay.map((r) => [r.day, r.n]));
  const fmt = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }); // YYYY-MM-DD
  const series = Array.from({ length: days }, (_, i) => {
    const day = fmt.format(new Date(Date.now() - (days - 1 - i) * 24 * 3600 * 1000));
    return { day, n: counts.get(day) ?? 0 };
  });
  return { status, series, latest, offers: all };
}
