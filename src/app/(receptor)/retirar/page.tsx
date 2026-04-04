"use client"

import * as React from "react"
import { MapPin, Users, Loader2, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DonationCard } from "@/components/shared/donation-card"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { DonationStatus } from "@/lib/constants"
import { toast } from "sonner"
import { listDonations } from "@/actions/donations"

type DonationItem = {
  id: string
  title: string
  donorName: string
  address: string
  servings: number
  status: DonationStatus
  windowEnd?: string
  distance?: string
}

export default function RetirarPage() {
  const [loading, setLoading] = React.useState(false)
  const [locating, setLocating] = React.useState(false)
  const [servings, setServings] = React.useState("1")
  const [donations, setDonations] = React.useState<DonationItem[]>([])
  const [hasSearched, setHasSearched] = React.useState(false)
  const [offline, setOffline] = React.useState(false)

  React.useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  async function handleLocate() {
    setLocating(true)
    try {
      await new Promise<void>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          reject,
          { timeout: 5000 }
        )
      )
      await handleSearch()
    } catch {
      toast.error("Não foi possível obter sua localização. Ative o GPS.")
    } finally {
      setLocating(false)
    }
  }

  async function handleSearch() {
    setLoading(true)
    setHasSearched(true)
    try {
      const result = await listDonations({ page: 1 })
      setDonations(result.data as DonationItem[])
    } catch {
      toast.error("Erro ao buscar doações.")
    } finally {
      setLoading(false)
    }
  }

  function handleRequest(id: string) {
    toast.success(`Solicitação enviada! Aguarde seu código. (ID: ${id})`)
  }

  return (
    <div className="flex flex-col min-h-full">
      {offline && (
        <div className="fixed top-14 left-0 right-0 z-20 bg-[var(--color-warning)] text-white px-4 py-2 text-sm flex items-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0" />
          Você está sem conexão. Algumas funções podem não estar disponíveis.
        </div>
      )}

      <div className="mx-auto w-full max-w-lg px-4 pt-6 space-y-6" style={{ fontSize: "18px" }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary-raw)]/10 px-4 py-2">
            <Users className="h-5 w-5 text-[var(--color-primary-raw)]" />
            <span className="font-bold text-[var(--color-primary-raw)]">
              {hasSearched ? `${donations.length} disponíveis em 5km` : "Buscar refeições próximas"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            data-testid="retirar-localizar-button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleLocate}
            disabled={locating}
          >
            {locating ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Localizando...</>
            ) : (
              <><MapPin className="mr-2 h-5 w-5" /> Usar minha localização</>
            )}
          </Button>

          <div className="space-y-1">
            <Label htmlFor="servings" className="text-base">Para quantas pessoas?</Label>
            <Input
              data-testid="retirar-servings-input"
              id="servings"
              type="text"
              inputMode="numeric"
              value={servings}
              onChange={(e) => setServings(e.target.value.replace(/\D/g, ""))}
              className="h-14 text-lg text-center"
              min="1"
            />
          </div>

          <Button
            data-testid="retirar-buscar-button"
            variant="default"
            size="lg"
            className="w-full h-14 text-lg animate-subtle-pulse"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Buscando...</>
            ) : (
              "Solicitar Refeição"
            )}
          </Button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : hasSearched && donations.length === 0 ? (
            <EmptyState
              title="Nenhuma refeição próxima"
              description="Tente em alguns minutos. Novos doadores publicam frequentemente."
            />
          ) : (
            donations.map((donation) => (
              <DonationCard
                key={donation.id}
                {...donation}
                onRequest={handleRequest}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
