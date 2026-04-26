"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import { MapPin, Users, Loader2, WifiOff, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DonationCard } from "@/components/shared/donation-card"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { DonationStatus } from "@/lib/constants"
import { toast } from "sonner"
import { listDonations } from "@/actions/donations"
import { useGeolocation } from "@/hooks/useGeolocation"

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

/** Formata countdown de bloqueio em dias ou horas */
function formatBlockCountdown(unblockedAt: Date): string {
  const diffMs = unblockedAt.getTime() - Date.now()
  if (diffMs <= 0) return "Em breve"
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24)
    return `Disponível em ${days} ${days === 1 ? "dia" : "dias"}`
  }
  return `Disponível em ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`
}

export default function RetirarPage() {
  const [loading, setLoading] = React.useState(false)
  const [servings, setServings] = React.useState("1")
  const [donations, setDonations] = React.useState<DonationItem[]>([])
  const [hasSearched, setHasSearched] = React.useState(false)
  const [offline, setOffline] = React.useState(false)
  const [isBlocked, setIsBlocked] = React.useState(false)
  const [unblockedAt, setUnblockedAt] = React.useState<Date | null>(null)
  const [blockCountdown, setBlockCountdown] = React.useState("")
  const searchAfterLocate = React.useRef(false)

  const { position, error: geoError, loading: locating, refetch } = useGeolocation(5000)

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

  // Verificar status de bloqueio ao montar a página
  React.useEffect(() => {
    async function checkBlockStatus() {
      try {
        const res = await fetch("/api/v1/codes?checkBlock=true", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (data?.unblockedAt) {
            const until = new Date(data.unblockedAt)
            if (until > new Date()) {
              setIsBlocked(true)
              setUnblockedAt(until)
              setBlockCountdown(formatBlockCountdown(until))
            }
          }
        }
      } catch {
        // Silencioso — se a API falhar, exibe o fluxo normal
      }
    }
    checkBlockStatus()
  }, [])

  // Atualizar countdown a cada minuto quando bloqueado
  React.useEffect(() => {
    if (!isBlocked || !unblockedAt) return
    const interval = setInterval(() => {
      if (unblockedAt <= new Date()) {
        setIsBlocked(false)
        clearInterval(interval)
      } else {
        setBlockCountdown(formatBlockCountdown(unblockedAt))
      }
    }, 60_000)
    return () => clearInterval(interval)
  }, [isBlocked, unblockedAt])

  // Quando posição é obtida após clique em "Usar minha localização", dispara a busca
  React.useEffect(() => {
    if (searchAfterLocate.current && position && !locating) {
      searchAfterLocate.current = false
      handleSearch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, locating])

  // Exibir toast se geolocalização falhar após clique intencional
  React.useEffect(() => {
    if (searchAfterLocate.current && geoError && !locating) {
      searchAfterLocate.current = false
      toast.error("Não foi possível obter sua localização. Ative o GPS.")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoError, locating])

  function handleLocate() {
    searchAfterLocate.current = true
    refetch()
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

        {/* Card de bloqueio — exibido quando receptor está bloqueado */}
        {isBlocked && unblockedAt ? (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 p-5 space-y-3 dark:border-amber-800 dark:bg-amber-950/20"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" />
              <p className="text-base font-semibold text-amber-800 dark:text-amber-200">
                Você está temporariamente bloqueado
              </p>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Você só poderá solicitar refeições em:{" "}
              <strong>{unblockedAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</strong>
            </p>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {blockCountdown}
            </p>
            <Link
              href="/faq#bloqueio"
              className="inline-block text-sm text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-400"
            >
              Entenda as regras de uso →
            </Link>
          </div>
        ) : (
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
        )}

        {!isBlocked && (
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
        )}
      </div>
    </div>
  )
}
