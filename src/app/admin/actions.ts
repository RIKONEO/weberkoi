"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, SESSION_DAYS, checkPassword, createSessionToken, verifySessionToken } from "@/lib/auth";
import {
  ENQUIRY_STATUSES,
  type EnquiryStatus,
  ORDER_STATUSES,
  type OrderStatus,
  deleteOffer,
  getOffer,
  getOrderWithItems,
  offerHasOrders,
  saveOffer,
  setEnquiryStatus,
  setShippingPaused,
  updateOrder,
} from "@/lib/data";
import { parseOfferForm } from "@/lib/offerForm";
import { stripe } from "@/lib/stripe";

export async function requireAdmin() {
  const jar = await cookies();
  if (!(await verifySessionToken(jar.get(SESSION_COOKIE)?.value))) redirect("/admin/logowanie");
}

const withError = (path: string, msg: string) => `${path}${path.includes("?") ? "&" : "?"}blad=${encodeURIComponent(msg)}`;

export async function login(form: FormData) {
  if (!(await checkPassword(String(form.get("password") ?? "")))) redirect(withError("/admin/logowanie", "Nieprawidłowe hasło."));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_DAYS * 24 * 3600,
  });
  redirect("/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin/logowanie");
}

function refreshShop(offerId?: string) {
  revalidatePath("/", "layout");
  if (offerId) revalidatePath(`/oferta/${offerId}`);
}

export async function saveOfferAction(form: FormData) {
  await requireAdmin();
  const existingId = String(form.get("existingId") ?? "") || undefined;
  const back = existingId ? `/admin/oferty/${existingId}` : "/admin/oferty/nowa";
  const parsed = parseOfferForm(form, existingId);
  if (!parsed.ok) redirect(withError(back, parsed.error));
  if (!existingId && (await getOffer(parsed.value.id, { includeHidden: true }))) {
    redirect(withError(back, `Oferta o adresie „${parsed.value.id}” już istnieje. Zmień adres.`));
  }
  await saveOffer(parsed.value, existingId);
  refreshShop(parsed.value.id);
  redirect(`/admin/oferty/${parsed.value.id}?zapisano=1`);
}

export async function deleteOfferAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (await offerHasOrders(id)) redirect(withError(`/admin/oferty/${id}`, "Ta oferta ma zamówienia, więc nie można jej usunąć. Ukryj ją zamiast tego."));
  await deleteOffer(id);
  refreshShop();
  redirect("/admin/oferty");
}

export async function updateOrderAction(form: FormData) {
  await requireAdmin();
  const no = String(form.get("no") ?? "");
  const status = String(form.get("status") ?? "") as OrderStatus;
  if (!(status in ORDER_STATUSES)) redirect(withError(`/admin/zamowienia/${no}`, "Nieznany status."));
  const trackingNo = String(form.get("trackingNo") ?? "").trim() || null;
  const note = String(form.get("note") ?? "").trim() || null;
  const before = await getOrderWithItems(no);
  await updateOrder(no, { status, trackingNo, note });
  // Anulowane w panelu, a nieopłacone: zamykamy stronę płatności, żeby klient nie zapłacił za zwolnione ryby.
  if (status === "anulowane" && before?.stripeSessionId && !before.paidAt && before.status !== "anulowane") {
    await stripe()?.checkout.sessions.expire(before.stripeSessionId).catch(() => {});
  }
  refreshShop();
  redirect(`/admin/zamowienia/${no}?zapisano=1`);
}

export async function setEnquiryStatusAction(form: FormData) {
  await requireAdmin();
  const status = String(form.get("status") ?? "") as EnquiryStatus;
  if (status in ENQUIRY_STATUSES) await setEnquiryStatus(Number(form.get("id")), status);
  revalidatePath("/admin/zapytania");
}

export async function setShippingPausedAction(form: FormData) {
  await requireAdmin();
  await setShippingPaused(form.get("paused") === "on");
  refreshShop();
  redirect("/admin/ustawienia?zapisano=1");
}
