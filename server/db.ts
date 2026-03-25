import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL não está definida no ambiente de produção.");
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("🔥 Unexpected pool error:", err);
});

export const db = drizzle(pool, { schema });

export async function query(text: string, params?: any[]) {
  return await pool.query(text, params);
}

export { pool as dbPool };
