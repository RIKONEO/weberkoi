// Uruchamiane przed `next build`: zakłada i aktualizuje tabele w bazie z DATABASE_URL.
// Bez DATABASE_URL (np. pierwszy build na Vercelu) po prostu pomija ten krok.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("Brak DATABASE_URL, pomijam migracje bazy.");
    return;
  }
  const client = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    console.log("Baza zaktualizowana.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
