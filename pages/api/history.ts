// pages/api/history.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { readDB } from "@/lib/db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await readDB()

    if (req.method === "GET") {
      return res.status(200).json(db.history || [])
    }

    res.setHeader("Allow", ["GET"])
    return res.status(405).end(`Método ${req.method} não permitido`)
  } catch (error) {
    console.error("Erro em /api/history:", error)
    return res.status(500).json({ error: "Erro ao buscar histórico" })
  }
}
