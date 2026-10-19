import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Jedno połączenie na proces; w trybie dev przeżywa przeładowania modułów.
// Łączymy się dopiero przy pierwszym zapytaniu, żeby `next build` działał bez DATABASE_URL.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql; db?: ReturnType<typeof makeDb> };

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Brak DATABASE_URL. Skopiuj .env.example do .env.local i uzupełnij.");
  return postgres(url, { max: 5 });
}

function makeDb(client: postgres.Sql) {
  return drizzle(client, { schema });
}

export function getSql(): postgres.Sql {
  return (globalForDb.sql ??= connect());
}

function getDb() {
  return (globalForDb.db ??= makeDb(getSql()));
}

type Db = ReturnType<typeof makeDb>;
export const db = new Proxy({} as Db, { get: (_t, prop) => Reflect.get(getDb(), prop) });
export const sql = new Proxy((() => {}) as unknown as postgres.Sql, {
  get: (_t, prop) => Reflect.get(getSql(), prop),
  apply: (_t, _this, args) => (getSql() as unknown as (...a: unknown[]) => unknown)(...args),
});
export { schema };
