// Adres i wspólne dane strony do metadanych (podgląd linków, wyszukiwarki).
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = new URL(host ? `https://${host}` : "http://localhost:3000");
export const SITE_NAME = "WEBER Nishikigoi";
export const OPEN_GRAPH_BASE = { siteName: SITE_NAME, locale: "pl_PL", type: "website" } as const;
