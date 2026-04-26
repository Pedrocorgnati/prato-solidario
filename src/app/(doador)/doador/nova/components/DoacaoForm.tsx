"use client"

import * as React from "react"
import { useActionState } from "react"
import { Loader2, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { cepSchema } from "@/validators/cep"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CepInput } from "@/components/shared/cep-input"
import { SchedulePicker } from "@/components/shared/schedule-picker"
import { createDoacaoAction } from "@/actions/donations"
import type { ActionResponse } from "@/types/common"
import type { Donation } from "@prisma/client"

// ---------------------------------------------------------------------------
// Client-side Zod schema (mirrors server schema for instant validation)
// ---------------------------------------------------------------------------

// Opções de tipo de alimento — espelha enum FoodType do Prisma
const FOOD_TYPE_OPTIONS = [
  { value: "REFEICAO_COMPLETA", label: "Refeição completa" },
  { value: "PORCAO", label: "Porção/Acompanhamento" },
  { value: "LANCHE", label: "Lanche" },
  { value: "SOBREMESA", label: "Sobremesa" },
  { value: "BEBIDA", label: "Bebida" },
  { value: "OUTROS", label: "Outros" },
] as const

type FoodTypeValue = (typeof FOOD_TYPE_OPTIONS)[number]["value"]

const doacaoClientSchema = z
  .object({
    portions: z.number().int().min(1, "Mínimo 1 porção").max(200, "Máximo 200 porções"),
    foodType: z.enum(
      ["REFEICAO_COMPLETA", "PORCAO", "LANCHE", "SOBREMESA", "BEBIDA", "OUTROS"],
      { error: "Selecione o tipo de alimento" }
    ),
    windowStart: z.string().min(1, "Horário de início obrigatório"),
    windowEnd: z.string().min(1, "Horário de fim obrigatório"),
    cep: cepSchema,
    logradouro: z.string().min(1, "Logradouro obrigatório"),
    bairro: z.string().min(1, "Bairro obrigatório"),
    cidade: z.string().min(1, "Cidade obrigatória"),
    estado: z.string().length(2, "Estado deve ter 2 letras"),
    radiusKm: z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(10)]),
    description: z.string().max(200, "Máximo 200 caracteres").optional(),
  })
  .refine(
    (data) => {
      if (!data.windowStart || !data.windowEnd) return true
      const today = new Date().toISOString().split("T")[0]
      const start = new Date(`${today}T${data.windowStart}:00`)
      const end = new Date(`${today}T${data.windowEnd}:00`)
      return end.getTime() - start.getTime() >= 30 * 60 * 1000
    },
    {
      message: "Janela de retirada deve ser de no mínimo 30 minutos.",
      path: ["windowEnd"],
    }
  )

type ClientFormData = z.infer<typeof doacaoClientSchema>

// ---------------------------------------------------------------------------
// Radius options
// ---------------------------------------------------------------------------

const RADIUS_OPTIONS = [
  { value: 1, label: "1 km" },
  { value: 2, label: "2 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
] as const

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: ActionResponse<Donation> = {
  data: null,
  error: null,
  status: 0,
}

// ---------------------------------------------------------------------------
// DoacaoForm
// ---------------------------------------------------------------------------

export function DoacaoForm() {
  // Server action state
  const [state, formAction, isPending] = useActionState(createDoacaoAction, initialState)

  // Local field state (controlled components not covered by native FormData)
  const [portions, setPortions] = React.useState(1)
  const [foodType, setFoodType] = React.useState<FoodTypeValue | "">("")
  const [cep, setCep] = React.useState("")
  const [logradouro, setLogradouro] = React.useState("")
  const [bairro, setBairro] = React.useState("")
  const [cidade, setCidade] = React.useState("")
  const [estado, setEstado] = React.useState("")
  const [windowStart, setWindowStart] = React.useState("")
  const [windowEnd, setWindowEnd] = React.useState("")
  const [radiusKm, setRadiusKm] = React.useState<1 | 2 | 5 | 10>(5)
  const [description, setDescription] = React.useState("")

  // Client validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Show server error as toast
  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function handleAddressFill(data: {
    logradouro: string
    bairro: string
    localidade: string
    uf: string
  }) {
    setLogradouro(data.logradouro)
    setBairro(data.bairro)
    setCidade(data.localidade)
    setEstado(data.uf)
  }

  function incrementPortions() {
    setPortions((p) => Math.min(p + 1, 200))
  }

  function decrementPortions() {
    setPortions((p) => Math.max(p - 1, 1))
  }

  function timeToISO(time: string): string {
    const today = new Date().toISOString().split("T")[0]
    return new Date(`${today}T${time}:00`).toISOString()
  }

  // ---------------------------------------------------------------------------
  // Submit handler — client validate then dispatch FormData to server action
  // ---------------------------------------------------------------------------

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Client-side validation
    const result = doacaoClientSchema.safeParse({
      portions,
      foodType,
      windowStart,
      windowEnd,
      cep,
      logradouro,
      bairro,
      cidade,
      estado,
      radiusKm,
      description: description || undefined,
    })

    if (!result.success) {
      e.preventDefault()
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString()
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})

    // Build FormData with ISO dates and let the native form action handle submission
    const formData = new FormData()
    formData.set("portions", String(portions))
    formData.set("foodType", foodType)
    formData.set("windowStart", timeToISO(windowStart))
    formData.set("windowEnd", timeToISO(windowEnd))
    formData.set("cep", cep)
    formData.set("logradouro", logradouro)
    formData.set("bairro", bairro)
    formData.set("cidade", cidade)
    formData.set("estado", estado)
    formData.set("radiusKm", String(radiusKm))
    if (description) formData.set("description", description)

    // Prevent native submit — we invoke the action manually with our FormData
    e.preventDefault()
    React.startTransition(() => {
      formAction(formData)
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Porções (stepper) */}
      <div className="space-y-1">
        <Label htmlFor="portions">Quantidade de porções</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={decrementPortions}
            disabled={portions <= 1}
            aria-label="Diminuir porções"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="portions"
            type="number"
            min={1}
            max={200}
            value={portions}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (!isNaN(v)) setPortions(Math.max(1, Math.min(200, v)))
            }}
            className="w-20 text-center"
            aria-label="Porções"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={incrementPortions}
            disabled={portions >= 200}
            aria-label="Aumentar porções"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {errors.portions && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.portions}</p>
        )}
      </div>

      {/* CEP + Endereço */}
      <CepInput
        value={cep}
        onChange={setCep}
        onAddressFill={handleAddressFill}
        error={errors.cep}
        required
      />

      {logradouro && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input
              id="logradouro"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              readOnly
            />
            {errors.logradouro && (
              <p className="text-xs text-[var(--color-danger)]">{errors.logradouro}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="numero">Número</Label>
            <Input
              id="numero"
              name="numero"
              placeholder="Nº"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              name="complemento"
              placeholder="Apto, bloco..."
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              readOnly
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              readOnly
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="estado">Estado</Label>
            <Input
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              readOnly
              maxLength={2}
            />
          </div>
        </div>
      )}

      {/* Horário */}
      <div className="space-y-1">
        <Label>Horário disponível para retirada</Label>
        <SchedulePicker
          startValue={windowStart}
          endValue={windowEnd}
          onStartChange={setWindowStart}
          onEndChange={setWindowEnd}
          error={errors.windowEnd}
        />
        {errors.windowStart && !errors.windowEnd && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.windowStart}</p>
        )}
      </div>

      {/* Raio de busca */}
      <div className="space-y-1">
        <Label>Raio de busca de receptores</Label>
        <div className="flex gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={radiusKm === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRadiusKm(opt.value)}
              aria-pressed={radiusKm === opt.value}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tipo de alimento */}
      <div className="space-y-1">
        <Label htmlFor="foodType">
          Tipo de alimento <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Select
          value={foodType}
          onValueChange={(v) => setFoodType(v as FoodTypeValue)}
        >
          <SelectTrigger id="foodType" aria-invalid={!!errors.foodType}>
            <SelectValue placeholder="Selecione o tipo..." />
          </SelectTrigger>
          <SelectContent>
            {FOOD_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.foodType && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.foodType}</p>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-1">
        <Label htmlFor="description">
          Descrição <span className="text-[var(--color-text-muted)] font-normal">(opcional)</span>
        </Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={200}
          className="w-full rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-raw)] resize-none"
          placeholder="Ingredientes, alergênicos, outros detalhes..."
        />
        <p className="text-xs text-[var(--color-text-muted)] text-right">
          {description.length}/200
        </p>
        {errors.description && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.description}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" variant="default" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publicando...
          </>
        ) : (
          "Publicar doação"
        )}
      </Button>
    </form>
  )
}
