// app/api/webhook/yampi/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readDB, writeDB } from '@/lib/db'
import { sendEmail, replaceVariables } from '@/lib/email'

// Se estiver usando arquivo direto app/api/webhook.ts, pode manter o mesmo conteúdo.

export async function POST(request: NextRequest) {
  try {
    // 1. Pega o payload da Yampi
    const payload = await request.json()

    const event = payload.event
    const data = payload.data

    // 2. Confere se é evento de pedido pago/aprovado
    if (event !== 'order.paid' && event !== 'order.approved') {
      return NextResponse.json({ ok: true, message: 'Evento ignorado' })
    }

    const order = data?.order
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado no payload' }, { status: 400 })
    }

    const customerName = order.customer?.name || ''
    const customerEmail = order.customer?.email
    const items = order.items || []
    const orderNumber = String(order.number ?? '')
    const total = Number(order.total ?? 0)
    const createdAt = order.created_at || new Date().toISOString()

    if (!customerEmail) {
      return NextResponse.json({ error: 'Email do cliente não encontrado' }, { status: 400 })
    }

    // 3. Lê banco (produtos, template e settings)
    const db = await readDB()
    const products = db.products || []
    const template = db.emailTemplate || {
      subject: 'Obrigado pela sua compra!',
      body: `
        <h1>Obrigado pela sua compra, {{nome_cliente}}!</h1>
        <p>Seu pagamento foi aprovado.</p>
        <p><strong>Produto:</strong> {{nome_produto}}</p>
        <p>
          <a href="{{link_produto}}" target="_blank">Acessar meu ebook</a>
        </p>
        <p>Pedido nº {{numero_pedido}} - {{data_pedido}}</p>
      `,
    }

    const settings = db.settings
    if (!settings) {
      return NextResponse.json(
        { error: 'Configurações de e-mail não definidas.' },
        { status: 500 },
      )
    }

    const history = db.history || []

    // 4. Para cada item comprado, tenta achar o produto no "banco"
    for (const item of items) {
      const itemName = item.name || ''
      const itemSku = item.sku || ''

      const product = products.find((p: any) => {
        // tenta por SKU, se existir, senão por nome
        if (p.sku && itemSku) return p.sku === itemSku
        return p.name === itemName
      })

      const productName = product?.name || itemName
      const productLink = product?.link || ''

      // Monta as variáveis para o template
      const vars = {
        nome_cliente: customerName,
        email_cliente: customerEmail,
        nome_produto: productName,
        link_produto: productLink,
        numero_pedido: orderNumber,
        valor: total.toFixed(2),
        data_pedido: new Date(createdAt).toLocaleDateString('pt-BR'),
      }

      const subject = replaceVariables(template.subject, vars)
      const html = replaceVariables(template.body, vars)

      try {
        // 5. Envia o e-mail
        await sendEmail({
          to: customerEmail,
          subject,
          html,
          settings,
        })

        // 6. Adiciona ao histórico (sucesso)
        history.unshift({
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          customerName,
          customerEmail,
          orderNumber,
          total,
          productName,
          productLink,
          status: 'success',
        })
      } catch (error: any) {
        // Se der erro, também registra no histórico
        history.unshift({
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          customerName,
          customerEmail,
          orderNumber,
          total,
          productName,
          productLink,
          status: 'error',
          errorMessage: error?.message || 'Erro ao enviar e-mail',
        })
      }
    }

    // 7. Salva o histórico atualizado
    db.history = history
    await writeDB(db)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json({ error: 'Erro interno no webhook' }, { status: 500 })
  }
}
