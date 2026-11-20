"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_DAYS, SITE_COOKIE, checkPassword, createSessionToken } from "@/lib/auth";
import { LOCK_PAGE, SITE_SCOPE, safeNext } from "@/lib/site-lock";
import { LIMITS, clientKey, isLimited, recordHit } from "@/lib/rate-limit";

export async function enterSite(form: FormData) {
  const next = safeNext(form.get("dalej"));
  const who = await clientKey();
  if (await isLimited(LIMITS.login, who)) redirect(`${LOCK_PAGE}?blad=limit&dalej=${encodeURIComponent(next)}`);
  if (!(await checkPassword(String(form.get("password") ?? "")))) {
    await recordHit(LIMITS.login, who);
    redirect(`${LOCK_PAGE}?blad=1&dalej=${encodeURIComponent(next)}`);
  }
  await setSiteCookie();
  redirect(next);
}

export async function setSiteCookie() {
  const jar = await cookies();
  jar.set(SITE_COOKIE, await createSessionToken(Date.now(), SITE_SCOPE), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}
