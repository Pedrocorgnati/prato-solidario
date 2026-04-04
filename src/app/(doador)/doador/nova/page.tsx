"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhotoUpload } from "@/components/shared/photo-upload"
import { SchedulePicker } from "@/components/shared/schedule-picker"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"
import { createDonation } from "@/actions/donations"

const schema = z.object({
  title: z.string().min(3, "Título obrigatório"),
  description: z.string().optional(),
  servings: z.string().min(1, "Quantidade obrigatória"),
  address: z.string().min(5, "Endereço obrigatório"),
})

type FormData = z.infer<typeof schema>

export default function NovaDoacaoPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [windowStart, setWindowStart] = React.useState("")
  const [windowEnd, setWindowEnd] = React.useState("")
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await createDonation({
        title: data.title,
        description: data.description,
        servings: parseInt(data.servings),
        address: data.address,
        windowStart,
        windowEnd,
      })
      toast.success("Doação publicada com sucesso!")
      router.push(ROUTES.DOADOR)
    } catch {
      toast.error("Erro ao publicar doação.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Publicar doação</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="title">O que você tem para doar?</Label>
          <Input id="title" {...register("title")} placeholder="Ex: Marmitas de frango com arroz" />
          {errors.title && <p className="text-xs text-[var(--color-danger)]">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <textarea
            id="description"
            {...register("description")}
            rows={3}
            className="w-full rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-raw)] resize-none"
            placeholder="Ingredientes, alergênicos, outros detalhes..."
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="servings">Quantidade de porções</Label>
          <Input
            id="servings"
            {...register("servings")}
            type="text"
            inputMode="numeric"
            placeholder="Ex: 10"
          />
          {errors.servings && <p className="text-xs text-[var(--color-danger)]">{errors.servings.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="address">Local de retirada</Label>
          <Input id="address" {...register("address")} placeholder="Rua, número, bairro" />
          {errors.address && <p className="text-xs text-[var(--color-danger)]">{errors.address.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Horário disponível</Label>
          <SchedulePicker
            startValue={windowStart}
            endValue={windowEnd}
            onStartChange={setWindowStart}
            onEndChange={setWindowEnd}
          />
        </div>
        <PhotoUpload label="Foto da doação (opcional)" />
        <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...</> : "Publicar doação"}
        </Button>
      </form>
    </div>
  )
}
