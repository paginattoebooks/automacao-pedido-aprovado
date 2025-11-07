// lib/pg.ts
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL não está definida nas variáveis de ambiente")
}

export const pool = new Pool({
  connectionString,
  // Neon precisa de SSL
  ssl: {
    rejectUnauthorized: false,
  },
})
