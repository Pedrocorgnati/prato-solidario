"use client"

import * as React from "react"
import { Plus, Star, Megaphone, Clock, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DonationCard } from "@/components/shared/donation-card"
import { BannerSlot } from "@/components/shared/banner-slot"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ROUTES } from "@/lib/constants"
import { cancelDonacaoAction } from "@/actions/donations"
import { ImpactoCard } from "./ImpactoCard"
import type { DonorMetrics } from "@/types/donation.types"

const POLL_INTERVAL_MS = 30_000 // 30 segundos

/** Formata timestamp como "Atualizado há X min" */
function formatLastUpdated(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin === 0) return "Atualizado agora"
  if (diffMin === 1) return "Atualizado há 1 min"
  return `Atualizado há ${diffMin} min`
}

const EXTENSION_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutos em ms
const MAX_EXTENSIONS = 2

/** Verifica se a doação pode ser estendida (expira em < 30min e não atingiu o limite). */
function canExtend(windowEnd: string | undefined, extensionCount: number | undefined): boolean {
  if (!windowEnd) return false
  const remaining = new Date(windowEnd).getTime() - Date.now()
  return remaining > 0 && remaining < EXTENSION_THRESHOLD_MS && (extensionCount ?? 0) < MAX_EXTENSIONS
}

interface BannerCreditCardProps {
  daysAvailable: number
}

function BannerCreditCard({ daysAvailable }: BannerCreditCardProps) {
  return (
    <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-[var(--color-primary-raw)]" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Banner disponível</p>
        </div>
        <Link href={ROUTES.DOADOR_CAMPANHAS}>
          <Button variant="outline" size="sm">Gerenciar</Button>
        </Link>
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--color-primary-raw)]">
        {daysAvailable} {daysAvailable === 1 ? 'dia' : 'dias'}
      </p>
      <p className="text-xs text-[var(--color-text-muted)]">
        de exibição disponíveis — conquistas ao atingir metas de doação
      </p>
    </div>
  )
}

interface DashboardContentProps {
  metrics: DonorMetrics
  donations: Record<string, unknown>[]
  isRestaurante?: boolean
}

export function DashboardContent({ metrics, donations: initialDonations, isRestaurante = false }: DashboardContentProps) {
  const router = useRouter()
  const [cancelTarget, setCancelTarget] = React.useState<string | null>(null)
  const [cancelling, setCancelling] = React.useState(false)
  const [extendingId, setExtendingId] = React.useState<string | null>(null)
  const [donations, setDonations] = React.useState<Record<string, unknown>[]>(initialDonations)
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date())
  const [lastUpdatedLabel, setLastUpdatedLabel] = React.useState("Atualizado agora")
  const [refreshing, setRefreshing] = React.useState(false)

  // Polling: atualiza status das doações ativas a cada 30s
  React.useEffect(() => {
    async function fetchDonations() {
      try {
        setRefreshing(true)
        const res = await fetch("/api/v1/donations?status=AVAILABLE,RESERVED&limit=20", {
          cache: "no-store",
        })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.donations)) {
            setDonations(data.donations as Record<string, unknown>[])
          }
          const now = new Date()
          setLastUpdated(now)
          setLastUpdatedLabel(formatLastUpdated(now))
        }
      } catch {
        // Silencioso — não interrompe UX
      } finally {
        setRefreshing(false)
      }
    }

    const interval = setInterval(fetchDonations, POLL_INTERVAL_MS)

    // Atualizar label do lastUpdated a cada minuto
    const labelInterval = setInterval(() => {
      setLastUpdatedLabel(formatLastUpdated(lastUpdated))
    }, 60_000)

    return () => {
      clearInterval(interval)
      clearInterval(labelInterval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdated])

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const result = await cancelDonacaoAction(cancelTarget)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Doação cancelada com sucesso.")
      }
    } catch {
      toast.error("Erro ao cancelar doação. Tente novamente.")
    } finally {
      setCancelling(false)
      setCancelTarget(null)
    }
  }

  async function handleExtend(donationId: string) {
    setExtendingId(donationId)
    try {
      const res = await fetch(`/api/v1/donations/${donationId}/extend`, { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        const extensoesRestantes = body?.extensoesRestantes as number | undefined
        const msg = extensoesRestantes === 0
          ? "Janela estendida por 30 minutos. Sem mais extensões disponíveis."
          : `Janela estendida por 30 minutos. ${extensoesRestantes} extensão restante.`
        toast.success(msg)
        router.refresh()
      } else {
        toast.error(body?.message ?? "Erro ao estender janela. Tente novamente.")
      }
    } catch {
      toast.error("Erro ao estender janela. Tente novamente.")
    } finally {
      setExtendingId(null)
    }
  }

  return (
    <div data-testid="doador-dashboard" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Painel do Doador
        </h1>
        <Link href={ROUTES.DOADOR_NOVA}>
          <Button
            data-testid="doador-nova-doacao-button"
            variant="default"
            size="md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova doação
          </Button>
        </Link>
      </div>

      {/* Impacto */}
      <ImpactoCard metrics={metrics} />

      {/* Card de crédito de banner — apenas DOADOR_RESTAURANTE */}
      {isRestaurante && metrics.activeBannerDays >= 0 && (
        <BannerCreditCard daysAvailable={metrics.activeBannerDays} />
      )}

      {/* Banner */}
      <BannerSlot />

      {/* Botao Sobrou! */}
      <Button
        data-testid="doador-sobrou-button"
        variant="secondary"
        size="lg"
        className="w-full animate-subtle-pulse"
        onClick={() => router.push(ROUTES.DOADOR_SOBROU)}
      >
        <Star className="mr-2 h-5 w-5" />
        Sobrou! Publicar agora
      </Button>

      {/* Doacoes ativas */}
      <div data-testid="doador-doacoes-ativas">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Doações ativas
          </h2>
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            {refreshing && <RefreshCw className="h-3 w-3 animate-spin" />}
            {lastUpdatedLabel}
          </span>
        </div>
        {donations.length === 0 ? (
          <EmptyState
            title="Nenhuma doação ativa"
            description="Publique uma doação para começar a impactar vidas."
            action={{
              label: "Publicar doação",
              onClick: () => router.push(ROUTES.DOADOR_NOVA),
            }}
          />
        ) : (
          <div className="space-y-3">
            {donations.map((d) => {
              const donationId = d.id as string
              const windowEnd = d.windowEnd as string | undefined
              const extensionCount = d.extensionCount as number | undefined
              const showExtend = canExtend(windowEnd, extensionCount)
              const extensoesRestantes = MAX_EXTENSIONS - (extensionCount ?? 0)

              return (
                <div key={donationId} className="space-y-2">
                  <DonationCard
                    id={donationId}
                    description={(d.description as string) ?? "Doação"}
                    donorName={undefined}
                    portions={(d.portions as number) ?? 0}
                    status={(d.status as string) ?? "AVAILABLE"}
                    windowStart={d.windowStart as string | undefined}
                    windowEnd={windowEnd}
                    radiusKm={d.radiusKm as number | undefined}
                    onCancel={(id) => setCancelTarget(id)}
                  />
                  {showExtend && (
                    <div className="flex items-center gap-2 px-1">
                      <Button
                        data-testid={`extend-button-${donationId}`}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={extendingId === donationId}
                        onClick={() => handleExtend(donationId)}
                      >
                        <Clock className="mr-2 h-3.5 w-3.5" />
                        {extendingId === donationId ? "Estendendo..." : "Estender 30min"}
                      </Button>
                      <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                        {extensoesRestantes === 1 ? "Última extensão" : `${extensoesRestantes} extensões restantes`}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null)
        }}
        title="Cancelar doação?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Sim, cancelar"
        variant="destructive"
        onConfirm={handleCancel}
        isLoading={cancelling}
      />
    </div>
  )
}
