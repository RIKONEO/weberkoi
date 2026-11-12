"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, SESSION_DAYS, checkPassword, createSessionToken, verifySessionToken } from "@/lib/auth";
import {
  ENQUIRY_STATUSES,
  type EnquiryStatus,
  addVariety,
  deleteOffer,
  deleteVariety,
  getOffer,
  listVarieties,
  moveVariety,
  offerHasOrders,
  renameVariety,
  saveOffer,
  setEnquiryStatus,
  setOfferFlag,
} from "@/lib/data";
import { parseOfferForm, parseVarietyName } from "@/lib/offerForm";

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
  const parsed = parseOfferForm(form, await listVarieties(), existingId);
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
  if (await offerHasOrders(id)) redirect(withError(`/admin/oferty/${id}`, "Ta oferta ma dawne zamówienia ze sklepu, więc nie można jej usunąć. Ukryj ją zamiast tego."));
  await deleteOffer(id);
  refreshShop();
  redirect("/admin/oferty");
}

/** Szybkie przełączniki na liście ofert: wyróżnienie i widoczność w sklepie. */
export async function setOfferFlagAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const flag = String(form.get("flag") ?? "");
  if (flag !== "featured" && flag !== "published") return;
  await setOfferFlag(id, flag, form.get("on") === "1");
  refreshShop(id);
  revalidatePath("/admin/oferty");
}

export async function setEnquiryStatusAction(form: FormData) {
  await requireAdmin();
  const status = String(form.get("status") ?? "") as EnquiryStatus;
  if (status in ENQUIRY_STATUSES) await setEnquiryStatus(Number(form.get("id")), status);
  revalidatePath("/admin/zapytania");
}

// --- odmiany ---

const VARIETIES_PAGE = "/admin/odmiany";

export async function addVarietyAction(form: FormData) {
  await requireAdmin();
  const parsed = parseVarietyName(String(form.get("name") ?? ""));
  if (!parsed.ok) redirect(withError(VARIETIES_PAGE, parsed.error));
  if (!(await addVariety(parsed.value))) redirect(withError(VARIETIES_PAGE, `Odmiana „${parsed.value}” już jest na liście.`));
  refreshShop();
  redirect(`${VARIETIES_PAGE}?zapisano=1`);
}

export async function renameVarietyAction(form: FormData) {
  await requireAdmin();
  const from = String(form.get("from") ?? "");
  const parsed = parseVarietyName(String(form.get("name") ?? ""));
  if (!parsed.ok) redirect(withError(VARIETIES_PAGE, parsed.error));
  if (parsed.value === from) redirect(VARIETIES_PAGE);
  if (!(await renameVariety(from, parsed.value))) redirect(withError(VARIETIES_PAGE, `Odmiana „${parsed.value}” już jest na liście.`));
  refreshShop();
  redirect(`${VARIETIES_PAGE}?zapisano=1`);
}

export async function deleteVarietyAction(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "");
  if (!(await deleteVariety(name))) redirect(withError(VARIETIES_PAGE, `Odmiany „${name}” używają oferty. Zmień w nich odmianę albo usuń je, a potem usuń odmianę.`));
  refreshShop();
  redirect(`${VARIETIES_PAGE}?zapisano=1`);
}

export async function moveVarietyAction(form: FormData) {
  await requireAdmin();
  await moveVariety(String(form.get("name") ?? ""), form.get("dir") === "up" ? -1 : 1);
  refreshShop();
  revalidatePath(VARIETIES_PAGE);
}
