// lib/db.ts
import fs from "fs/promises"
import path from "path"

// Caminho do arquivo JSON usado como "banco de dados"
const DB_PATH = path.join(process.cwd(), "db.json")

// ---------- TIPOS ----------

export type Product = {
  id: string            // ID interno do app
  name: string          // Nome do produto
  link: string          // Link do e-book (Drive)
  description?: string
  yampiId?: string      // ID do produto na Yampi
}

export type EmailSettings = {
  smtpHost?: string
  smtpPort?: string
  smtpUser?: string
  smtpPassword?: string  // senha de app / SMTP
  senderName?: string
  senderEmail?: string
}

export type EmailTemplate = {
  subject: string
  body: string
}

export type HistoryEntry = {
  id: string
  createdAt: string
  customerName: string
  customerEmail: string
  orderNumber: string
  total: number
  productName: string
  productLink?: string
  status: "success" | "error"
  errorMessage?: string
}

export type DB = {
  products?: Product[]
  settings?: EmailSettings
  emailTemplate?: EmailTemplate
  history?: HistoryEntry[]
}

// ---------- FUNÇÕES DE ACESSO AO "BANCO" ----------

// Lê o arquivo db.json
export async function readDB(): Promise<DB> {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8")
    return JSON.parse(data) as DB
  } catch (err: any) {
    // Se o arquivo não existir, cria um banco vazio
    if (err.code === "ENOENT") {
      const empty: DB = {
        products: [],
        settings: undefined,
        emailTemplate: undefined,
        history: [],
      }
      await writeDB(empty)
      return empty
    }
    throw err
  }
}

// Salva o banco no arquivo
export async function writeDB(data: DB): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8")
}

// Lê apenas uma seção específica (ex: "products", "settings"...)
export async function getSection<K extends keyof DB>(
  key: K
): Promise<NonNullable<DB[K]>> {
  const db = await readDB()
  const value = db[key]

  if (Array.isArray(value)) {
    return (value as any) as NonNullable<DB[K]>
  }

  return (value || ({} as any)) as NonNullable<DB[K]>
}

// Atualiza apenas uma seção do banco (merge simples)
export async function updateDB<K extends keyof DB>(key: K, value: DB[K]) {
  const db = await readDB()
  db[key] = value
  await writeDB(db)
}

