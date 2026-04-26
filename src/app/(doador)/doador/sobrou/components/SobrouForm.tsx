"use client"

import * as React from "react"
import { useActionState, useTransition } from "react"
import { Loader2, MapPin, Minus, Plus, Timer, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CepInput } from "@/components/shared/cep-input"
import { useGeolocation } from "@/hooks/useGeolocation"
import { publishSobrouAction } from "@/actions/donations"
import { toast } from "sonner"
import type { ActionResponse } from "@/types/common"
import type { Donation } from "@prisma/client"

type LocationMode = "gps" | "cep"

interface GpsCoords {
  lat: number
  lng: number
}

const initialState: ActionResponse<Donation> = {
  data: null,
  error: null,
  status: 0,
}

export function SobrouForm() {
  const [portions, setPortions] = React.useState(5)
  const { position: geoPosition, error: geoError, loading: gpsLoading } = useGeolocation()
  const [locationMode, setLocationMode] = React.useState<LocationMode>("gps")
  const gpsCoords = geoPosition ? { lat: geoPosition.lat, lng: geoPosition.lng } : null
  const gpsError = geoError ?? ""
  const [cep, setCep] = React.useState("")
  const [cepError, setCepError] = React.useState("")
  const [addressData, setAddressData] = React.useState<{
    bairro: string
    localidade: string
    uf: string
  } | null>(null)

  const [isPending, startTransition] = useTransition()
  const [state, formAction] = useActionState(publishSobrouAction, initialState)

  // Reagir ao erro de geolocalização: fallback para CEP
  React.useEffect(() => {
    if (geoError) {
      setLocationMode("cep")
    }
  }, [geoError])

  // Mostrar toast de erro do server action
  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  function incrementPortions() {
    setPortions((p) => Math.min(200, p + 1))
  }

  function decrementPortions() {
    setPortions((p) => Math.max(1, p - 1))
  }

  function handleCepAddressFill(data: {
    logradouro: string
    bairro: string
    localidade: string
    uf: string
  }) {
    setAddressData({
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
    })
    setCepError("")
  }

  function handleSubmit(formData: FormData) {
    // Validacoes client-side
    if (locationMode === "cep" && !cep.trim()) {
      setCepError("Informe seu CEP.")
      return
    }

    // Preencher FormData com os dados do componente
    formData.set("portions", String(portions))
    formData.set("locationType", locationMode)

    if (locationMode === "gps" && gpsCoords) {
      formData.set("lat", String(gpsCoords.lat))
      formData.set("lng", String(gpsCoords.lng))
    }

    if (locationMode === "cep") {
      formData.set("cep", cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"))
      if (addressData) {
        formData.set("bairro", addressData.bairro)
        formData.set("cidade", addressData.localidade)
        formData.set("estado", addressData.uf)
      }
    }

    startTransition(() => {
      formAction(formData)
    })
  }

  const isSubmitting = isPending

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Cabecalho */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-secondary-raw)]/10">
            <Zap className="h-8 w-8 text-[var(--color-secondary-raw)]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Sobrou!
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Publicacao rapida para quem precisa agora.
        </p>
      </div>

      {/* Badge de janela */}
      <div className="flex justify-center">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
          <Timer className="h-3.5 w-3.5" />
          Disponivel por 30 minutos
        </Badge>
      </div>

      {/* Stepper de porcoes */}
      <div className="space-y-2">
        <Label htmlFor="portions">Quantas porcoes sobraram?</Label>
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={decrementPortions}
            disabled={portions <= 1}
            aria-label="Diminuir porcoes"
          >
            <Minus className="h-5 w-5" />
          </Button>
          <span
            id="portions"
            className="min-w-[4rem] text-center text-3xl font-bold text-[var(--color-text-primary)]"
          >
            {portions}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={incrementPortions}
            disabled={portions >= 200}
            aria-label="Aumentar porcoes"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Entre 1 e 200 porcoes
        </p>
      </div>

      {/* Localizacao */}
      <div className="space-y-3">
        <Label>Localizacao</Label>

        {gpsLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border-raw)] p-3 text-sm text-[var(--color-text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Obtendo sua localizacao...
          </div>
        )}

        {!gpsLoading && locationMode === "gps" && gpsCoords && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <MapPin className="h-4 w-4" />
              GPS ativo — localizacao obtida
            </div>
            <button
              type="button"
              className="mt-1 text-xs text-[var(--color-text-muted)] underline"
              onClick={() => setLocationMode("cep")}
            >
              Usar CEP ao inves do GPS
            </button>
          </div>
        )}

        {!gpsLoading && locationMode === "cep" && (
          <div className="space-y-2">
            {gpsError && (
              <p className="text-xs text-[var(--color-text-muted)]">
                {gpsError} Informe seu CEP abaixo.
              </p>
            )}
            <CepInput
              value={cep}
              onChange={setCep}
              onAddressFill={handleCepAddressFill}
              error={cepError}
              required
            />
            {addressData && (
              <p className="text-xs text-[var(--color-text-secondary)]">
                {addressData.bairro}, {addressData.localidade} - {addressData.uf}
              </p>
            )}
            {gpsCoords && (
              <button
                type="button"
                className="text-xs text-[var(--color-text-muted)] underline"
                onClick={() => setLocationMode("gps")}
              >
                Voltar para GPS
              </button>
            )}
          </div>
        )}
      </div>

      {/* Botao de publicar */}
      <Button
        type="submit"
        variant="secondary"
        size="lg"
        className="w-full h-14 text-lg animate-subtle-pulse"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Publicando...
          </>
        ) : (
          "Publicar Sobrou!"
        )}
      </Button>
    </form>
  )
}
