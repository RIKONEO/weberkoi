import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SITE_COOKIE, verifySessionToken } from "@/lib/auth";
import { LOCK_PAGE, SITE_LOCKED, SITE_SCOPE } from "@/lib/site-lock";

const NOINDEX = "noindex, nofollow, noarchive";

function locked(res: NextResponse) {
  if (SITE_LOCKED) res.headers.set("X-Robots-Tag", NOINDEX);
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Panel admina: jak dotąd, własne logowanie.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/logowanie") return locked(NextResponse.next());
    if (await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return locked(NextResponse.next());
    const url = req.nextUrl.clone();
    url.pathname = "/admin/logowanie";
    url.search = "";
    return locked(NextResponse.redirect(url));
  }

  if (!SITE_LOCKED) return NextResponse.next();

  // Strona sklepu zablokowana hasłem (src/lib/site-lock.ts).
  if (pathname === LOCK_PAGE || pathname === "/robots.txt") return locked(NextResponse.next());
  if (await verifySessionToken(req.cookies.get(SITE_COOKIE)?.value, Date.now(), SITE_SCOPE)) return locked(NextResponse.next());

  if (pathname.startsWith("/api/")) {
    return locked(NextResponse.json({ error: "Strona jest w przygotowaniu." }, { status: 401 }));
  }
  const url = req.nextUrl.clone();
  url.pathname = LOCK_PAGE;
  url.search = "";
  if (pathname !== "/" || req.nextUrl.search) url.searchParams.set("dalej", pathname + req.nextUrl.search);
  return locked(NextResponse.redirect(url));
}

// Wszystko poza plikami Next.js, ikonami strony (favicon, icon, apple-icon) i logo z /public, żeby były widoczne także przy blokadzie hasłem.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|logo[^/]*\\.jpg).*)"] };
