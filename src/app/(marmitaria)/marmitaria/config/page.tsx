"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function MarmitariaConfigPage() {
  const [loading, setLoading] = React.useState(false)

  async function handleSave() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    toast.success("Configurações salvas!")
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Configurações</h1>
      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">Nome da marmitaria</Label>
          <Input id="name" defaultValue="Marmitaria da Dona Maria" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="price">Preço por marmita (R$)</Label>
          <Input id="price" defaultValue="14,00" inputMode="decimal" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="capacity">Capacidade diária</Label>
          <Input id="capacity" defaultValue="50" inputMode="numeric" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Descrição do cardápio</Label>
          <textarea
            id="description"
            rows={3}
            className="w-full rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-raw)] resize-none"
            defaultValue="Comida caseira, feita com amor. Cardápio varia diariamente."
          />
        </div>
      </div>
      <Button variant="default" size="lg" className="w-full" onClick={handleSave} disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar configurações"}
      </Button>
    </div>
  )
}
