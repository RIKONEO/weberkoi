import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Podglądy z Vercela (adresy *.vercel.app gałęzi) nie powinny trafiać do Google, tylko strona główna sklepu.
  const production = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  return {
    rules: production ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/stopklatka/"] } : { userAgent: "*", disallow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
