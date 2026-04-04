"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"
import { reportAbsence } from "@/actions/codes"

const schema = z.object({
  reason: z.string().min(10, "Descreva o problema com pelo menos 10 caracteres"),
})

export default function ReportarPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<{ reason: string }>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ reason }: { reason: string }) {
    setLoading(true)
    try {
      await reportAbsence("code-id", reason)
      toast.success("Problema reportado. Obrigado pelo feedback!")
      router.push(ROUTES.RETIRAR)
    } catch {
      toast.error("Erro ao reportar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          Reportar problema
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Conte o que aconteceu para ajudarmos a melhorar.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label>Motivo</Label>
          <div className="space-y-2">
            {["Doador não estava presente", "Comida acabou", "Endereço errado", "Código não foi aceito", "Outro"].map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="type" value={opt} className="h-4 w-4" />
                <span className="text-sm text-[var(--color-text-primary)]">{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="reason">Descrição</Label>
          <textarea
            id="reason"
            {...register("reason")}
            rows={4}
            className="w-full rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-raw)] resize-none"
            placeholder="Descreva o que aconteceu..."
          />
          {errors.reason && (
            <p className="text-xs text-[var(--color-danger)]">{errors.reason.message}</p>
          )}
        </div>
        <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : "Enviar relato"}
        </Button>
      </form>
    </div>
  )
}
