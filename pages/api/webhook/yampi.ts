// pages/api/webhook/yampi.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { pool } from "@/lib/pg"
import { sendEmail, replaceVariables } from "@/lib/email"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).end(`Método ${req.method} não permitido`)
  }

  try {
    const payload = req.body

    // Ajuste aqui de acordo com o formato real da Yampi
    const event = payload.event
    const data = payload.data?.[0]

    if (!data || (event !== "order.paid" && event !== "order.approved")) {
      return res.status(200).json({ ok: true }) // ignoramos outros eventos
    }

    const order = data.order
    const items = order.items || []

    const customerName = order.customer?.name || ""
    const customerEmail = order.customer?.email || ""
    const orderNumber = order.number?.toString() || ""
    const total = Number(order.total || 0)
    const orderDate = order.created_at || ""
    const orderDateFormatted = orderDate?.slice(0, 10) || ""

    // Carrega configurações, template e produtos do banco
    const [settingsResult, templateResult, productsResult] = await Promise.all([
      pool.query(
        `SELECT
           sender_name as "senderName",
           sender_email as "senderEmail",
           smtp_host as "smtpHost",
           smtp_port as "smtpPort",
           smtp_user as "smtpUser",
           smtp_password as "smtpPass"
         FROM settings
         WHERE id = 1`
      ),
      pool.query(`SELECT subject, body FROM email_template WHERE id = 1`),
      pool.query(
        `SELECT id, name, link, description, yampi_id AS "yampiId"
         FROM products`
      ),
    ])

    const settings = settingsResult.rows[0]
    const template =
      templateResult.rows[0] || {
        subject: "Obrigado pela sua compra!",
        body: "",
      }
    const products = productsResult.rows

    if (!settings) {
      return res
        .status(500)
        .json({ error: "Configurações de e-mail não definidas" })
    }

    // Para cada item do pedido, tenta achar o produto cadastrado
    const historyEntries: any[] = []

    for (const item of items) {
      const itemId = String(item.id ?? "")
      const itemName = item.name ?? ""

      let product =
        products.find((p: any) => p.yampiId && String(p.yampiId) === itemId) ||
        products.find((p: any) => p.name === itemName)

      const productName = product?.name || itemName
      const productLink = product?.link || ""

      const vars = {
        nome_cliente: customerName,
        nome_produto: productName,
        link_produto: productLink,
        numero_pedido: orderNumber,
        data_pedido: orderDateFormatted,
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

        historyEntries.push({
          id: Date.now().toString() + "-" + itemId,
          created_at: new Date().toISOString(),
          customer_name: customerName,
          customer_email: customerEmail,
          order_number: orderNumber,
          total,
          product_name: productName,
          product_link: productLink,
          status: "success",
          error_message: null,
        })
      } catch (error: any) {
        console.error("Erro ao enviar e-mail:", error)
        historyEntries.push({
          id: Date.now().toString() + "-" + itemId,
          created_at: new Date().toISOString(),
          customer_name: customerName,
          customer_email: customerEmail,
          order_number: orderNumber,
          total,
          product_name: productName,
          product_link: productLink,
          status: "error",
          error_message:
            error?.message || "Erro ao enviar e-mail",
        })
      }
    }

    // Salva histórico em lote
    if (historyEntries.length > 0) {
      const values = historyEntries
        .map(
          (_, i) =>
            `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`
        )
        .join(", ")

      const flatParams = historyEntries.flatMap((h) => [
        h.id,
        h.created_at,
        h.customer_name,
        h.customer_email,
        h.order_number,
        h.total,
        h.product_name,
        h.product_link,
        h.status,
        h.error_message,
      ])

      await pool.query(
        `INSERT INTO history (
           id,
           created_at,
           customer_name,
           customer_email,
           order_number,
           total,
           product_name,
           product_link,
           status,
           error_message
         ) VALUES ${values}`,
        flatParams
      )
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("Erro no webhook Yampi:", error)
    return res
      .status(500)
      .json({ error: "Erro interno no webhook da Yampi" })
  }
}
