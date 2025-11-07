// pages/api/history.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { pool } from "@/lib/pg"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const { rows } = await pool.query(
        `SELECT
           id,
           created_at AS "createdAt",
           customer_name AS "customerName",
           customer_email AS "customerEmail",
           order_number AS "orderNumber",
           total,
           product_name AS "productName",
           product_link AS "productLink",
           status,
           error_message AS "errorMessage"
         FROM history
         ORDER BY created_at DESC
         LIMIT 100`
      )

      return res.status(200).json(rows)
    }

    res.setHeader("Allow", ["GET"])
    return res.status(405).end(`Método ${req.method} não permitido`)
  } catch (error) {
    console.error("Erro em /api/history:", error)
    return res.status(500).json({ error: "Erro interno em /api/history" })
  }
}
