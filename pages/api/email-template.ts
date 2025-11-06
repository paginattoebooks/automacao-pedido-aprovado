// pages/api/email-template.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { readDB, writeDB, DB, EmailTemplate } from "@/lib/db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db: DB = await readDB()

    if (req.method === "GET") {
      const template: EmailTemplate =
        db.emailTemplate || {
          subject: "Obrigado pela sua compra!",
          body:
            "<h1>Obrigado pela sua compra, {{nome_cliente}}!</h1>" +
            "<p>Seu pagamento foi aprovado.</p>" +
            "<p>Produto: {{nome_produto}}</p>" +
            '<p><a href=\"{{link_produto}}\" target=\"_blank\">Acessar meu ebook</a></p>' +
            "<p>Pedido nº {{numero_pedido}} - {{data_pedido}}</p>",
        }

      return res.status(200).json(template)
    }

    if (req.method === "POST") {
      const template = req.body as EmailTemplate

      db.emailTemplate = template
      await writeDB(db)

      return res.status(200).json(template)
    }

    res.setHeader("Allow", ["GET", "POST"])
    return res.status(405).end(`Método ${req.method} não permitido`)
  } catch (error) {
    console.error("Erro em /api/email-template:", error)
    return res.status(500).json({ error: "Erro ao salvar/buscar template" })
  }
}
