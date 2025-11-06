// pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { readDB, writeDB, DB, Product } from "@/lib/db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db: DB = await readDB()

    // GET /api/products -> lista produtos salvos
    if (req.method === "GET") {
      return res.status(200).json(db.products || [])
    }

    // POST /api/products -> cria um novo produto
    if (req.method === "POST") {
      const { name, link, description, yampiId } = req.body as Partial<Product>

      if (!name || !link) {
        return res.status(400).json({ error: "Nome e link são obrigatórios" })
      }

      const newProduct: Product = {
        id: Date.now().toString(),      // ID interno
        name,
        link,                           // 👈 Link do e-book (Drive)
        description: description || "",
        yampiId: yampiId || "",         // ID na Yampi
      }

      db.products = [...(db.products || []), newProduct]
      await writeDB(db)

      return res.status(201).json(newProduct)
    }

    // DELETE /api/products  -> apaga um produto
    if (req.method === "DELETE") {
      // Aceita tanto ?id=123 quanto { "id": "123" } no body
      let id: string | undefined

      if (typeof req.query.id === "string") {
        id = req.query.id
      } else if (req.body && typeof req.body.id === "string") {
        id = req.body.id
      }

      if (!id) {
        return res.status(400).json({ error: "ID do produto é obrigatório" })
      }

      db.products = (db.products || []).filter((p) => p.id !== id)
      await writeDB(db)

      return res.status(200).json({ ok: true })
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"])
    return res.status(405).end(`Método ${req.method} não permitido`)
  } catch (error) {
    console.error("Erro em /api/products:", error)
    return res.status(500).json({ error: "Erro ao processar produtos" })
  }
}
