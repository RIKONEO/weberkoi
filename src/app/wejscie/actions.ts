"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_DAYS, SITE_COOKIE, checkPassword, createSessionToken } from "@/lib/auth";
import { LOCK_PAGE, SITE_SCOPE, safeNext } from "@/lib/site-lock";

export async function enterSite(form: FormData) {
  const next = safeNext(form.get("dalej"));
  if (!(await checkPassword(String(form.get("password") ?? "")))) {
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
