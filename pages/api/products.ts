// pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { pool } from "@/lib/pg"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const { rows } = await pool.query(
        `SELECT id, name, link, description, yampi_id AS "yampiId"
         FROM products
         ORDER BY name`
      )
      return res.status(200).json(rows)
    }

    if (req.method === "POST") {
      const { name, link, description, yampiId } = req.body

      if (!name || !link) {
        return res
          .status(400)
          .json({ error: "Nome e link são obrigatórios" })
      }

      const id = Date.now().toString()

      const { rows } = await pool.query(
        `INSERT INTO products (id, name, link, description, yampi_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, link, description, yampi_id AS "yampiId"`,
        [id, name, link, description || null, yampiId || null]
      )

      return res.status(201).json(rows[0])
    }

    if (req.method === "PUT") {
      const { id, name, link, description, yampiId } = req.body

      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" })
      }

      await pool.query(
        `UPDATE products
         SET name = $2,
             link = $3,
             description = $4,
             yampi_id = $5
         WHERE id = $1`,
        [id, name, link, description || null, yampiId || null]
      )

      return res.status(200).json({ ok: true })
    }

    if (req.method === "DELETE") {
      const { id } = req.query

      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "ID inválido" })
      }

      await pool.query(`DELETE FROM products WHERE id = $1`, [id])

      return res.status(200).json({ ok: true })
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"])
    return res.status(405).end(`Método ${req.method} não permitido`)
  } catch (error) {
    console.error("Erro em /api/products:", error)
    return res.status(500).json({ error: "Erro interno em /api/products" })
  }
}
