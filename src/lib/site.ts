// Adres i wspólne dane strony do metadanych (podgląd linków, wyszukiwarki, linki w mailach).
// Na Vercelu zawsze docelowa domena sklepu, także w podglądach gałęzi, żeby linki w mailach
// i w Google prowadziły na weberkoi.pl, a nie na adres *.vercel.app. Lokalnie: localhost.
export const SITE_DOMAIN = "weberkoi.pl";

export const SITE_URL = new URL(process.env.VERCEL ? `https://${SITE_DOMAIN}` : "http://localhost:3000");
export const SITE_NAME = "WEBER Nishikigoi";
export const OPEN_GRAPH_BASE = { siteName: SITE_NAME, locale: "pl_PL", type: "website" } as const;
