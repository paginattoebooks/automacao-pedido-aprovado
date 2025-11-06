// pages/api/settings.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { readDB, writeDB, DB, EmailSettings } from "@/lib/db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db: DB = await readDB()

    if (req.method === "GET") {
      return res.status(200).json(db.settings || {})
    }

    if (req.method === "POST") {
      const settings = req.body as EmailSettings

      // validação simples (pode ficar mais chata depois)
      if (
        !settings.senderEmail ||
        !settings.smtpHost ||
        !settings.smtpPort ||
        !settings.smtpUser ||
        !settings.smtpPassword
      ) {
        return res.status(400).json({ error: "Campos SMTP obrigatórios faltando" })
      }

      db.settings = settings
      await writeDB(db)

      return res.status(200).json(settings)
    }

    res.setHeader("Allow", ["GET", "POST"])
    return res.status(405).end(`Método ${req.method} não permitido`)
  } catch (error) {
    console.error("Erro em /api/settings:", error)
    return res.status(500).json({ error: "Erro ao salvar configurações" })
  }
}
