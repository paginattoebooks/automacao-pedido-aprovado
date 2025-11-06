// lib/email.ts
import nodemailer from "nodemailer"
import type { EmailSettings } from "./db"

type SendEmailParams = {
  to: string
  subject: string
  html: string
  settings: EmailSettings
}

// Substitui {{variavel}} no template
export function replaceVariables(template: string, vars: Record<string, string>) {
  let result = template || ""

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
    result = result.replace(regex, value ?? "")
  }

  return result
}

// Envia o e-mail usando SMTP das configurações salvas
export async function sendEmail({ to, subject, html, settings }: SendEmailParams) {
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: Number(settings.smtpPort) || 587,
    secure: Number(settings.smtpPort) === 465, // 465 = SSL, 587 = STARTTLS
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword, // 👈 MESMO NOME DEFINIDO EM EmailSettings
    },
  })

  await transporter.sendMail({
    from: `"${settings.senderName || settings.senderEmail}" <${settings.senderEmail}>`,
    to,
    subject,
    html,
  })
}
