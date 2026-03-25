import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL não definida");
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../migrations");

async function runMigrations() {
  console.log("[migrate] Aplicando migrations de:", migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log("[migrate] Concluído com sucesso.");
  await pool.end();
}

runMigrations().catch(err => {
  console.error("[migrate] Erro:", err);
  process.exit(1);
});
