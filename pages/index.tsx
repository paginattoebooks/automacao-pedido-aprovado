"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "scr/components/ui/card"
import { Button } from "scr/components/ui/button"
import { Input } from "scr/components/ui/input"
import { Label } from "scr/components/ui/label"
import { Textarea } from "scr/components/ui/textarea"

type PageKey = "products" | "email" | "settings" | "history"

interface Product {
  id: string
  name: string
  link: string
  description?: string
  yampiId?: string        // 👈
}


interface EmailTemplate {
  subject: string
  body: string
}

interface EmailSettings {
  senderName: string
  senderEmail: string
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPassword: string
}

interface HistoryItem {
  id: string
  date: string
  customerEmail: string
  productName: string
  status: string
  errorMessage?: string
}

export default function IndexPage() {
  const [currentPage, setCurrentPage] = useState<PageKey>("products")

  const [products, setProducts] = useState<Product[]>([])
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({
  name: "",
  link: "",
  description: "",
  yampiId: "",
})

  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: "Obrigado pela sua compra!",
    body:
      "<h1>Obrigado pela sua compra, {{nome_cliente}}!</h1>" +
      "<p>Seu pagamento foi aprovado.</p>" +
      "<p>Produto: {{nome_produto}}</p>" +
      '<p><a href="{{link_produto}}" target="_blank">Acessar meu ebook</a></p>',
  })

  const [settings, setSettings] = useState<EmailSettings>({
    senderName: "",
    senderEmail: "",
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
  })

  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function showError(message: string) {
    setError(message)
    setSuccessMessage(null)
  }

  function showSuccess(message: string) {
    setSuccessMessage(message)
    setError(null)
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        const [productsRes, emailRes, settingsRes, historyRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/email-template"),
          fetch("/api/settings"),
          fetch("/api/history"),
        ])

        if (productsRes.ok) {
          setProducts(await productsRes.json())
        }
        if (emailRes.ok) {
          setEmailTemplate(await emailRes.json())
        }
        if (settingsRes.ok) {
          setSettings(await settingsRes.json())
        }
        if (historyRes.ok) {
          setHistory(await historyRes.json())
        }
      } catch (err) {
        console.error(err)
        showError("Erro ao carregar dados iniciais.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      })
      if (!response.ok) {
        throw new Error("Erro ao criar produto")
      }
      const created = await response.json()
      setProducts((prev) => [...prev, created])
      setNewProduct({ name: "", link: "", description: "" })
      showSuccess("Produto cadastrado com sucesso.")
    } catch (err) {
      console.error(err)
      showError("Erro ao salvar produto.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Tem certeza que deseja apagar este produto?")) return
    try {
      setSaving(true)
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!response.ok) {
        throw new Error("Erro ao apagar produto")
      }
      setProducts((prev) => prev.filter((p) => p.id !== id))
      showSuccess("Produto apagado.")
    } catch (err) {
      console.error(err)
      showError("Erro ao apagar produto.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await fetch("/api/email-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailTemplate),
      })
      if (!response.ok) throw new Error("Erro ao salvar template")
      showSuccess("Template de e-mail salvo.")
    } catch (err) {
      console.error(err)
      showError("Erro ao salvar template.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = { ...settings }
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Erro ao salvar configurações")
      showSuccess("Configurações salvas.")
    } catch (err) {
      console.error(err)
      showError("Erro ao salvar configurações.")
    } finally {
      setSaving(false)
    }
  }

  const webhookUrl =
    typeof window !== "undefined" ? `${window.location.origin}/api/webhook/yampi` : "URL será exibida aqui"

  function renderAlerts() {
    if (!error && !successMessage) return null
    return (
      <div className="mb-4 space-y-2">
        {error && <div className="rounded-md bg-red-100 text-red-800 px-4 py-2 text-sm">{error}</div>}
        {successMessage && (
          <div className="rounded-md bg-green-100 text-green-800 px-4 py-2 text-sm">{successMessage}</div>
        )}
      </div>
    )
  }

       function renderProductsPage() {
         return (
          <div className="space-y-6">
            {renderAlerts()}

        <Card>
          <CardHeader>
            <CardTitle>Produtos digitais (E-books)</CardTitle>
            <CardDescription>Cadastre aqui o nome e o link de acesso de cada produto.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do produto</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="link">Link do e-book</Label>
                <Input
                  id="link"
                  type="url"
                  value={newProduct.link}
                  onChange={(e) => setNewProduct((p) => ({ ...p, link: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Adicionar produto"}
              </Button>
            </form>
            <div>
            <Label htmlFor="yampiId">ID do produto na Yampi (ID #)</Label>
            <Input
            id="yampiId"
            value={newProduct.yampiId}
            onChange={(e) =>
      setNewProduct((p) => ({ ...p, yampiId: e.target.value }))
    }
    placeholder="Ex: 42973591"
  />
</div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de produtos</CardTitle>
            <CardDescription>Produtos cadastrados serão utilizados pelo webhook da Yampi.</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 && <p className="text-sm text-gray-500">Nenhum produto cadastrado ainda.</p>}
            <ul className="space-y-2">
              {products.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                  <p className="font-medium">
                  {p.name}
                  {p.yampiId && (
                  <span className="ml-2 text-xs text-gray-500">ID Yampi: {p.yampiId}</span>
                 )}
                </p>
                 <p className="text-xs text-gray-500 break-all">{p.link}</p>
               </div>
                  <Button type="button" onClick={() => handleDeleteProduct(p.id)}>
                    Apagar
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  function renderEmailPage() {
    return (
      <div className="space-y-6">
        {renderAlerts()}
        <Card>
          <CardHeader>
            <CardTitle>Template de e-mail</CardTitle>
            <CardDescription>
              Use as variáveis: {"{{nome_cliente}} {{email_cliente}} {{nome_produto}} {{link_produto}} {{numero_pedido}} {{valor}} {{data_pedido}}"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={emailTemplate.subject}
                  onChange={(e) => setEmailTemplate((t) => ({ ...t, subject: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="body">Corpo do e-mail (HTML permitido)</Label>
                <Textarea
                  id="body"
                  className="min-h-[200px]"
                  value={emailTemplate.body}
                  onChange={(e) => setEmailTemplate((t) => ({ ...t, body: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar template"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  function renderSettingsPage() {
    return (
      <div className="space-y-6">
        {renderAlerts()}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de e-mail & Webhook</CardTitle>
            <CardDescription>Preencha os dados do servidor SMTP e copie o link do webhook.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>URL do webhook (Yampi)</Label>
              <div className="flex gap-2 mt-1">
                <Input readOnly value={webhookUrl} />
                <Button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl)
                    showSuccess("Link do webhook copiado.")
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senderName">Nome do remetente</Label>
                  <Input
                    id="senderName"
                    value={settings.senderName}
                    onChange={(e) => setSettings((s) => ({ ...s, senderName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="senderEmail">E-mail do remetente</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={settings.senderEmail}
                    onChange={(e) => setSettings((s) => ({ ...s, senderEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings((s) => ({ ...s, smtpHost: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings((s) => ({ ...s, smtpPort: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpUser">SMTP User</Label>
                  <Input
                    id="smtpUser"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings((s) => ({ ...s, smtpUser: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) => setSettings((s) => ({ ...s, smtpPassword: e.target.value }))}
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar configurações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  function renderHistoryPage() {
    return (
      <div className="space-y-6">
        {renderAlerts()}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de envios</CardTitle>
            <CardDescription>Envios feitos automaticamente pelo webhook.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 && <p className="text-sm text-gray-500">Nenhum envio registrado ainda.</p>}
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="border rounded-md px-3 py-2 text-sm">
                  <p className="font-medium">
                    {h.customerEmail} — {h.productName}
                  </p>
                  <p className="text-xs text-gray-500">{h.date}</p>
                  <p className="text-xs">
                    Status:{" "}
                    <span className={h.status === "success" ? "text-green-700" : "text-red-700"}>{h.status}</span>
                  </p>
                  {h.errorMessage && <p className="text-xs text-red-700">Erro: {h.errorMessage}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r p-4 space-y-4">
        <h1 className="text-xl font-bold">Automação Yampi E-mail</h1>
        <nav className="space-y-2">
          <Button
            type="button"
            className={`w-full justify-start ${currentPage === "products" ? "" : "bg-white text-black border"}`}
            onClick={() => setCurrentPage("products")}
          >
            Produtos
          </Button>
          <Button
            type="button"
            className={`w-full justify-start ${currentPage === "email" ? "" : "bg-white text-black border"}`}
            onClick={() => setCurrentPage("email")}
          >
            Template de e-mail
          </Button>
          <Button
            type="button"
            className={`w-full justify-start ${currentPage === "settings" ? "" : "bg-white text-black border"}`}
            onClick={() => setCurrentPage("settings")}
          >
            Configurações
          </Button>
          <Button
            type="button"
            className={`w-full justify-start ${currentPage === "history" ? "" : "bg-white text-black border"}`}
            onClick={() => setCurrentPage("history")}
          >
            Histórico
          </Button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {loading && <p className="mb-4 text-sm text-gray-500">Carregando...</p>}

        {currentPage === "products" && renderProductsPage()}
        {currentPage === "email" && renderEmailPage()}
        {currentPage === "settings" && renderSettingsPage()}
        {currentPage === "history" && renderHistoryPage()}
      </main>
    </div>
  )
}
