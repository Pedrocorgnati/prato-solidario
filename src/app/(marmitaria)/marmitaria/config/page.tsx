"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { SchedulePicker } from "@/components/shared/schedule-picker"
import { PhotoUpload } from "@/components/shared/photo-upload"
import { Loader2, AlertCircle, Lock, Info } from "lucide-react"
import { toast } from "sonner"

const DAYS_OF_WEEK = [
  { value: "MON", label: "Seg" },
  { value: "TUE", label: "Ter" },
  { value: "WED", label: "Qua" },
  { value: "THU", label: "Qui" },
  { value: "FRI", label: "Sex" },
  { value: "SAT", label: "Sáb" },
  { value: "SUN", label: "Dom" },
] as const

const DEADLINE_OPTIONS = [
  { value: "1", label: "1 hora antes" },
  { value: "2", label: "2 horas antes" },
  { value: "4", label: "4 horas antes" },
  { value: "8", label: "8 horas antes" },
] as const

interface SettingsData {
  id: string
  status: string
  pricePerMeal: number | null
  schedule: {
    days: string[]
    startTime: string
    endTime: string
    dailyCapacity: number
    orderDeadlineHours: string
  } | null
  photoUrl: string | null
  publicAddress: { bairro: string; cidade: string } | null
  hasPriceLockedByPurchases: boolean
}

interface FormErrors {
  photo?: string
  price?: string
  days?: string
  capacity?: string
  neighborhood?: string
  city?: string
}

export default function MarmitariaConfigPage() {
  // Loading state
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  // Settings data
  const [hasPriceLock, setHasPriceLock] = React.useState(false)

  // Form fields
  const [photoUrl, setPhotoUrl] = React.useState("")
  const [pricePerMeal, setPricePerMeal] = React.useState("")
  const [selectedDays, setSelectedDays] = React.useState<string[]>([])
  const [startTime, setStartTime] = React.useState("11:00")
  const [endTime, setEndTime] = React.useState("14:00")
  const [dailyCapacity, setDailyCapacity] = React.useState("50")
  const [orderDeadlineHours, setOrderDeadlineHours] = React.useState("2")
  const [description, setDescription] = React.useState("")
  const [neighborhood, setNeighborhood] = React.useState("")
  const [city, setCity] = React.useState("")

  const [errors, setErrors] = React.useState<FormErrors>({})

  // Load current settings
  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/marmitarias/settings")
        if (!res.ok) throw new Error("Erro ao carregar configurações")
        const settings: SettingsData = await res.json()

        setHasPriceLock(settings.hasPriceLockedByPurchases)
        setPhotoUrl(settings.photoUrl ?? "")
        setPricePerMeal(settings.pricePerMeal ? String(settings.pricePerMeal) : "")
        setDescription("")

        if (settings.schedule) {
          setSelectedDays(settings.schedule.days)
          setStartTime(settings.schedule.startTime)
          setEndTime(settings.schedule.endTime)
          setDailyCapacity(String(settings.schedule.dailyCapacity))
          setOrderDeadlineHours(settings.schedule.orderDeadlineHours)
        }

        if (settings.publicAddress) {
          setNeighborhood(settings.publicAddress.bairro)
          setCity(settings.publicAddress.cidade)
        }
      } catch {
        setLoadError("Não foi possível carregar as configurações. Tente novamente.")
      } finally {
        setInitialLoading(false)
      }
    }
    load()
  }, [])

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}

    // USER_023: foto obrigatória
    if (!photoUrl) {
      newErrors.photo = "Foto obrigatória. O patrocinador precisa identificar visualmente a marmitaria."
    }

    // USER_024: preço > 0
    const priceNum = parseFloat(pricePerMeal.replace(",", "."))
    if (!pricePerMeal || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = "Preço deve ser maior que zero."
    }

    // USER_025: ao menos 1 dia
    if (selectedDays.length === 0) {
      newErrors.days = "Selecione ao menos 1 dia de funcionamento."
    }

    const capacityNum = parseInt(dailyCapacity, 10)
    if (!dailyCapacity || isNaN(capacityNum) || capacityNum < 1) {
      newErrors.capacity = "Capacidade mínima é 1."
    } else if (capacityNum > 500) {
      newErrors.capacity = "Capacidade máxima é 500."
    }

    if (neighborhood && neighborhood.length < 2) {
      newErrors.neighborhood = "Bairro deve ter ao menos 2 caracteres."
    }
    if (city && city.length < 2) {
      newErrors.city = "Cidade deve ter ao menos 2 caracteres."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    setSaving(true)
    try {
      const priceNum = parseFloat(pricePerMeal.replace(",", "."))

      const body: Record<string, unknown> = {
        schedule: {
          days: selectedDays,
          startTime,
          endTime,
          dailyCapacity: parseInt(dailyCapacity, 10),
          orderDeadlineHours,
        },
      }

      // Only send price if not locked
      if (!hasPriceLock) {
        body.pricePerMeal = priceNum
      }

      if (photoUrl) {
        body.photoUrl = photoUrl
      }

      if (description.trim()) {
        body.description = description.trim()
      }

      if (neighborhood && city) {
        body.publicAddress = {
          neighborhood,
          city,
        }
      }

      const res = await fetch("/api/v1/marmitarias/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        const errorMsg = errorData?.error?.message ?? "Erro ao salvar configurações"

        if (errorData?.error?.code === "PRICE_LOCKED") {
          toast.error("Preço bloqueado: há patrocinadores com compras aprovadas.")
          setHasPriceLock(true)
          return
        }

        if (errorData?.error?.code === "PHOTO_REQUIRED") {
          setErrors((prev) => ({ ...prev, photo: "Foto obrigatória." }))
          toast.error("Foto obrigatória.")
          return
        }

        toast.error(errorMsg)
        return
      }

      toast.success("Configurações salvas com sucesso!")
    } catch {
      toast.error("Erro ao salvar. Verifique sua conexão e tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary-raw)]" />
      </div>
    )
  }

  if (loadError) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8" />}
        title="Erro ao carregar"
        description={loadError}
        action={{ label: "Tentar novamente", onClick: () => window.location.reload() }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Configurações</h1>

      {/* Foto — USER_023 */}
      <section className="space-y-2">
        <PhotoUpload
          value={photoUrl}
          onChange={(url) => {
            setPhotoUrl(url)
            setErrors((prev) => ({ ...prev, photo: undefined }))
          }}
          onRemove={() => setPhotoUrl("")}
          label="Foto da marmitaria *"
        />
        {errors.photo && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            {errors.photo}
          </p>
        )}
      </section>

      {/* Preço — USER_024 */}
      <section className="space-y-1">
        <Label htmlFor="price">Preço por marmita (R$) *</Label>
        {hasPriceLock ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-md border border-[var(--color-border-raw)] bg-[var(--color-surface)] px-3 py-2">
              <Lock className="h-4 w-4 text-[var(--color-text-muted)]" />
              <span className="text-sm text-[var(--color-text-primary)]">
                R$ {pricePerMeal ? parseFloat(pricePerMeal.replace(",", ".")).toFixed(2).replace(".", ",") : "—"}
              </span>
            </div>
            <p className="flex items-start gap-1 text-xs text-[var(--color-text-muted)]">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Preço bloqueado pois há patrocinadores com compras aprovadas.
            </p>
          </div>
        ) : (
          <>
            <Input
              id="price"
              value={pricePerMeal}
              onChange={(e) => {
                setPricePerMeal(e.target.value)
                setErrors((prev) => ({ ...prev, price: undefined }))
              }}
              inputMode="decimal"
              placeholder="14,00"
            />
            {errors.price && (
              <p className="text-xs text-[var(--color-danger)]" role="alert">
                {errors.price}
              </p>
            )}
          </>
        )}
      </section>

      {/* Horário de funcionamento — USER_025 */}
      <section className="space-y-3">
        <Label>Dias de funcionamento *</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => {
                toggleDay(day.value)
                setErrors((prev) => ({ ...prev, days: undefined }))
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedDays.includes(day.value)
                  ? "bg-[var(--color-primary-raw)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-muted-raw)]"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        {errors.days && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            {errors.days}
          </p>
        )}

        <SchedulePicker
          startValue={startTime}
          endValue={endTime}
          onStartChange={setStartTime}
          onEndChange={setEndTime}
          name="schedule"
        />

        <div className="space-y-1">
          <Label htmlFor="capacity">Capacidade diária *</Label>
          <Input
            id="capacity"
            value={dailyCapacity}
            onChange={(e) => {
              setDailyCapacity(e.target.value)
              setErrors((prev) => ({ ...prev, capacity: undefined }))
            }}
            inputMode="numeric"
            placeholder="50"
          />
          {errors.capacity && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.capacity}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="deadline">Prazo para pedidos</Label>
          <select
            id="deadline"
            value={orderDeadlineHours}
            onChange={(e) => setOrderDeadlineHours(e.target.value)}
            className="w-full rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-raw)]"
          >
            {DEADLINE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Descrição */}
      <section className="space-y-1">
        <Label htmlFor="description">Descrição do cardápio</Label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-raw)] resize-none"
          placeholder="Comida caseira, feita com amor. Cardápio varia diariamente."
          maxLength={500}
        />
        <p className="text-xs text-[var(--color-text-muted)] text-right">
          {description.length}/500
        </p>
      </section>

      {/* Endereço público — LGPD: apenas bairro e cidade */}
      <section className="space-y-3">
        <div>
          <Label>Endereço público</Label>
          <p className="text-xs text-[var(--color-text-muted)]">
            Apenas bairro e cidade são exibidos publicamente (LGPD).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value)
                setErrors((prev) => ({ ...prev, neighborhood: undefined }))
              }}
              placeholder="Centro"
            />
            {errors.neighborhood && (
              <p className="text-xs text-[var(--color-danger)]" role="alert">
                {errors.neighborhood}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setErrors((prev) => ({ ...prev, city: undefined }))
              }}
              placeholder="São Paulo"
            />
            {errors.city && (
              <p className="text-xs text-[var(--color-danger)]" role="alert">
                {errors.city}
              </p>
            )}
          </div>
        </div>
      </section>

      <Button
        variant="default"
        size="lg"
        className="w-full"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar configurações"
        )}
      </Button>
    </div>
  )
}
