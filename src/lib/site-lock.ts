// Strona w budowie: cały sklep tylko po wpisaniu hasła (tego samego co do panelu, ADMIN_PASSWORD),
// żeby konkurencja jej nie oglądała. Panel admina działa jak dotąd.
//
// ŻEBY OTWORZYĆ STRONĘ DLA WSZYSTKICH: zmień `true` na `false` poniżej i wypchnij na main.
export const SITE_LOCKED = true;

export const SITE_SCOPE = "site:";
export const LOCK_PAGE = "/wejscie";

/** Bezpieczny adres powrotu po wpisaniu hasła: tylko ścieżka w obrębie tej strony. */
export function safeNext(next: unknown): string {
  const s = typeof next === "string" ? next : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") && !s.startsWith(LOCK_PAGE) ? s : "/";
}
