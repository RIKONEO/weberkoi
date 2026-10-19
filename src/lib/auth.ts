// Sesja panelu admina: podpisane ciasteczko „<wygaśnięcie>.<HMAC>”. Działa w middleware
// (Edge) i na serwerze, bo używa tylko Web Crypto.

export const SESSION_COOKIE = "wk_admin";
export const SESSION_DAYS = 7;

const enc = new TextEncoder();

async function hmac(data: string): Promise<string> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SECRET musi mieć co najmniej 32 znaki.");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const exp = String(now + SESSION_DAYS * 24 * 3600 * 1000);
  return `${exp}.${await hmac(exp)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(Number(exp) > now)) return false;
  try {
    return safeEqual(sig, await hmac(exp));
  } catch {
    return false;
  }
}

export async function checkPassword(given: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Porównujemy skróty, żeby czas porównania nie zależał od długości hasła.
  const [a, b] = await Promise.all([hmac(`pw:${given}`), hmac(`pw:${expected}`)]);
  return safeEqual(a, b);
}
