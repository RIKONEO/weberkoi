// Limit liczby prób (logowanie, zgłoszenia), wspólny dla wszystkich serwerów Vercela, bo trzymany w bazie.
// Adres IP zapisujemy tylko jako skrót, a wpisy starsze niż okno są od razu kasowane.
import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { db, schema } from "@/db";

const { rateHits } = schema;

export type Limit = { bucket: string; max: number; windowMin: number };

export const LIMITS = {
  /** Błędne hasło (panel albo wejście na stronę): 10 na 15 minut z jednego adresu. */
  login: { bucket: "login", max: 10, windowMin: 15 },
  /** Zgłoszenia z jednego adresu: 5 na godzinę. */
  enquiryIp: { bucket: "enquiry", max: 5, windowMin: 60 },
  /** Wszystkie zgłoszenia razem: 40 na godzinę (chroni limit maili w Resend przed botem z wielu adresów). */
  enquiryAll: { bucket: "enquiry-all", max: 40, windowMin: 60 },
} satisfies Record<string, Limit>;

/** Skrót adresu IP odwiedzającego (Vercel podaje go w x-forwarded-for / x-real-ip). */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(`weberkoi:${ip}`).digest("hex").slice(0, 32);
}

/** Czy limit jest już wyczerpany (nic nie zapisuje). Przy błędzie bazy nie blokuje. */
export async function isLimited(limit: Limit, key: string): Promise<boolean> {
  try {
    const since = new Date(Date.now() - limit.windowMin * 60_000);
    const [row] = await db
      .select({ n: count() })
      .from(rateHits)
      .where(and(eq(rateHits.bucket, limit.bucket), eq(rateHits.key, key), gte(rateHits.at, since)));
    return (row?.n ?? 0) >= limit.max;
  } catch (err) {
    console.error("limit prób: błąd odczytu", err);
    return false;
  }
}

/** Zapisuje jedną próbę i sprząta wpisy starsze niż okno. */
export async function recordHit(limit: Limit, key: string): Promise<void> {
  try {
    const since = new Date(Date.now() - limit.windowMin * 60_000);
    await db.delete(rateHits).where(and(eq(rateHits.bucket, limit.bucket), lt(rateHits.at, since)));
    await db.insert(rateHits).values({ bucket: limit.bucket, key });
  } catch (err) {
    console.error("limit prób: błąd zapisu", err);
  }
}
