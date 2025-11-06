// pages/api/webhook/yampi.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { readDB, writeDB } from "@/lib/db"
import { sendEmail, replaceVariables } from "@/lib/email"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).end(`Método ${req.method} não permitido`)
  }

  try {
    const payload = req.body

    const event = payload.event
    const data = payload.data

    // só processa se for pedido pago/aprovado
    if (event !== "order.paid" && event !== "order.approved") {
      return res.status(200).json({ ok: true, message: "Evento ignorado" })
    }

    const order = data?.order
    if (!order) {
      return res.status(400).json({ error: "Pedido não encontrado no payload" })
    }

    const customerName = order.customer?.name || ""
    const customerEmail = order.customer?.email
    const items = order.items || []
    const orderNumber = String(order.number ?? "")
    const total = Number(order.total ?? 0)
    const createdAt = order.created_at || new Date().toISOString()

    if (!customerEmail) {
      return res.status(400).json({ error: "Email do cliente não encontrado" })
    }

    const db = await readDB()
    const products = db.products || []
    const template =
      db.emailTemplate || {
        subject: "Obrigado pela sua compra!",
        body:
          "<h1>Obrigado pela sua compra, {{nome_cliente}}!</h1>" +
          "<p>Seu pagamento foi aprovado.</p>" +
          "<p>Produto: {{nome_produto}}</p>" +
          '<p><a href=\"{{link_produto}}\" target=\"_blank\">Acessar meu ebook</a></p>' +
          "<p>Pedido nº {{numero_pedido}} - {{data_pedido}}</p>",
      }

    const settings = db.settings
    if (!settings) {
      return res.status(500).json({ error: "Configurações de e-mail não definidas" })
    }

    const history = db.history || []

    // para cada item do pedido
    for (const item of items) {
      const itemId = String(item.id ?? "")    // ID vem da Yampi
      const itemName = item.name || ""

      // 👇 CASAMENTO PELO ID
      const product = products.find((p: any) => {
        if (p.yampiId) return String(p.yampiId) === itemId
        return p.name === itemName // fallback por nome, se não tiver ID
      })

      const productName = product?.name || itemName
      const productLink = product?.link || ""

      const vars = {
        nome_cliente: customerName,
        email_cliente: customerEmail,
        nome_produto: productName,
        link_produto: productLink || "",
        numero_pedido: orderNumber,
        valor: total.toFixed(2),
        data_pedido: new Date(createdAt).toLocaleDateString("pt-BR"),
      }


      const subject = replaceVariables(template.subject, vars)
      const html = replaceVariables(template.body, vars)

      try {
        await sendEmail({
          to: customerEmail,
          subject,
          html,
          settings,
        })

        history.unshift({
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          customerName,
          customerEmail,
          orderNumber,
          total,
          productName,
          productLink,
          status: "success",
        })
      } catch (error: any) {
        history.unshift({
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          customerName,
          customerEmail,
          orderNumber,
          total,
          productName,
          productLink,
          status: "error",
          errorMessage: error?.message || "Erro ao enviar e-mail",
        })
      }
    }

    db.history = history
    await writeDB(db)

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("Erro no webhook Yampi:", error)
    return res.status(500).json({ error: "Erro interno no webhook" })
  }
}
