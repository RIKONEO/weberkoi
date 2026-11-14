import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SITE_LOCKED } from "@/lib/site-lock";

export default function robots(): MetadataRoute.Robots {
  // Podglądy z Vercela (adresy *.vercel.app gałęzi) nie powinny trafiać do Google, tylko strona główna sklepu.
  // Strona zablokowana hasłem też nie ma trafiać do wyszukiwarek.
  const production = !SITE_LOCKED && (process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true);
  return {
    rules: production ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/stopklatka/"] } : { userAgent: "*", disallow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
