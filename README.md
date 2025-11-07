# Automação de Pedido Aprovado (Yampi)

Aplicativo em Next.js para automatizar o envio de e-mail quando um pedido da Yampi é aprovado.

## Funcionalidades

- Cadastro de produtos digitais (e-books) com:
  - Nome
  - Link de acesso (Drive)
  - ID do produto na Yampi
- Template de e-mail HTML com variáveis:
  - `{{nome_cliente}}`
  - `{{nome_produto}}`
  - `{{link_produto}}`
  - `{{numero_pedido}}`
  - `{{data_pedido}}`
- Configuração de SMTP
- Webhook `/api/webhook/yampi` para receber pedidos da Yampi
- Histórico de envios de e-mail

## Tecnologias

- Next.js
- TypeScript
- Nodemailer
- Tailwind CSS

## Como rodar

```bash
npm install
npm run dev
# abre http://localhost:3000 (ou porta que o Next mostrar)
