// pages/api/settings.ts
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
           sender_name as "senderName",
           sender_email as "senderEmail",
           smtp_host as "smtpHost",
           smtp_port as "smtpPort",
           smtp_user as "smtpUser",
           smtp_password as "smtpPass"
         FROM settings
         WHERE id = 1`
      )

      return res.status(200).json(rows[0] || {})
    }

    if (req.method === "POST") {
      const { senderName, senderEmail, smtpHost, smtpPort, smtpUser, smtpPass } =
        req.body

      await pool.query(
        `UPDATE settings
         SET sender_name = $1,
             sender_email = $2,
             smtp_host = $3,
             smtp_port = $4,
             smtp_user = $5,
             smtp_password = $6
         WHERE id = 1`,
        [senderName, senderEmail, smtpHost, smtpPort, smtpUser, smtpPass]
      )

      return res.status(200).json({
        senderName,
        senderEmail,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
      })
    }

    res.setHeader("Allow", ["GET", "POST"])
    return res.status(405).end(`Método ${req.method} não permitido`)
  } catch (error) {
    console.error("Erro em /api/settings:", error)
    return res.status(500).json({ error: "Erro interno em /api/settings" })
  }
}
