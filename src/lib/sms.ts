// SMS z potwierdzeniem rezerwacji przez SMSAPI.pl. Bez SMSAPI_TOKEN nic nie wysyłamy
// (zgłoszenie i tak się zapisuje, a błąd SMS-a tylko trafia do logów Vercela).
import "server-only";
import { CONTACT } from "./contact";
import { formatDay, pickupDeadline } from "./pickup";

/** Numer w formacie 48XXXXXXXXX; null, gdy to nie wygląda na polską komórkę ani numer z kierunkowym. */
export function smsNumber(phone: string): string | null {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9) d = `48${d}`;
  return d.length >= 11 && d.length <= 15 ? d : null;
}

export type SmsFish = { title: string; fishNo?: number | null; qty: number };

/** Krótka treść (SMSAPI zamienia polskie znaki na zwykłe litery, żeby SMS był tańszy i dłuższy). */
export function reservationText(items: SmsFish[], now = new Date()): string {
  const byOffer = new Map<string, { nos: number[]; qty: number }>();
  for (const it of items) {
    const g = byOffer.get(it.title) ?? { nos: [], qty: 0 };
    if (it.fishNo) g.nos.push(it.fishNo);
    else g.qty += it.qty;
    byOffer.set(it.title, g);
  }
  const fish = [...byOffer.entries()]
    .map(([title, g]) => [g.nos.length ? `${title} nr ${g.nos.sort((a, b) => a - b).join(",")}` : "", g.qty ? `${title} ${g.qty} szt.` : ""].filter(Boolean).join("; "))
    .join("; ");
  return `WEBER Nishikigoi: rezerwacja przyjeta. ${fish.replace(/\.$/, "")}. Odbior osobisty w Zakrzewie do ${formatDay(pickupDeadline(now))}. Zadzwonimy, zeby potwierdzic. Tel. ${CONTACT.phone}`;
}

/** Wysyła potwierdzenie rezerwacji SMS-em. Zwraca false, gdy SMS-y nie są skonfigurowane albo numer jest zły. */
export async function sendReservationSms(phone: string, items: SmsFish[]): Promise<boolean> {
  const token = process.env.SMSAPI_TOKEN;
  if (!token) {
    console.warn("zgłoszenie: brak SMSAPI_TOKEN, SMS z potwierdzeniem nie wysłany");
    return false;
  }
  const to = smsNumber(phone);
  if (!to) {
    console.warn("zgłoszenie: numer telefonu nie nadaje się do SMS-a", { phone });
    return false;
  }
  const body = new URLSearchParams({ to, message: reservationText(items), format: "json", encoding: "utf-8", normalize: "1" });
  // Nazwa nadawcy (np. „WEBER KOI”) musi być najpierw zatwierdzona w panelu SMSAPI; bez niej idzie z numeru SMSAPI.
  if (process.env.SMS_FROM) body.set("from", process.env.SMS_FROM);
  const res = await fetch("https://api.smsapi.pl/sms.do", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: number; message?: string };
  if (!res.ok || data.error) throw new Error(`SMSAPI ${res.status}: ${data.error ?? ""} ${data.message ?? ""}`.trim());
  return true;
}
