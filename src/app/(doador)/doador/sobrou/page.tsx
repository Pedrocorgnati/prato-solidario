"use client"

import * as React from "react"
import { Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"
import { createDonation } from "@/actions/donations"

export default function SobrouPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [servings, setServings] = React.useState("5")

  async function handlePublish() {
    if (!title.trim()) {
      toast.error("Descreva brevemente o que sobrou.")
      return
    }
    setLoading(true)
    try {
      await createDonation({
        title,
        servings: parseInt(servings) || 5,
        address: "Endereço salvo no perfil",
        windowStart: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        windowEnd: new Date(Date.now() + 3 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      })
      toast.success("Publicado! As pessoas já podem solicitar.")
      router.push(ROUTES.DOADOR)
    } catch {
      toast.error("Erro ao publicar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-secondary-raw)]/10">
            <Zap className="h-8 w-8 text-[var(--color-secondary-raw)]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Sobrou!</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Publicação rápida. Usamos seu endereço e horário padrão.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="title">O que sobrou?</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: 8 marmitas de frango, bolo de chocolate..."
            className="h-14 text-base"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="servings">Para quantas pessoas?</Label>
          <Input
            id="servings"
            value={servings}
            onChange={(e) => setServings(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            className="h-14 text-lg text-center"
          />
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="w-full h-14 text-lg animate-subtle-pulse"
          onClick={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publicando...</>
          ) : (
            "Publicar agora!"
          )}
        </Button>
      </div>
    </div>
  )
}
