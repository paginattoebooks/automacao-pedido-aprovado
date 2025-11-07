// lib/pg.ts
// Wrapper de conexão com PostgreSQL usando pg

// Usamos require para evitar problema de typings do pacote "pg"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada (env DATABASE_URL)");
}

const pool = new Pool({
  connectionString,
  // se o Neon pedir SSL explícito, descomenta:
  // ssl: { rejectUnauthorized: false },
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(text, params);
  return (result.rows[0] as T) ?? null;
}

export default pool;
