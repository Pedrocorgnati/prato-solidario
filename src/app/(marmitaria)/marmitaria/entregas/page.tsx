'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Package, Search, Loader2, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { formatDateBr } from '@/utils/date'

interface PendingMeal {
  id: string
  quantity: number
  createdAt: string
  donationId: string | null
}

export default function EntregasPage() {
  const [meals, setMeals] = useState<PendingMeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [processingCode, setProcessingCode] = useState(false)

  const fetchMeals = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/marmitarias/meals?status=RESERVED')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setMeals(Array.isArray(json) ? json : json.data ?? [])
    } catch {
      toast.error('Erro ao carregar entregas pendentes.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMeals()
  }, [fetchMeals])

  const handleConfirmDelivery = async (mealId: string) => {
    setProcessingId(mealId)
    try {
      const res = await fetch(`/api/v1/marmitarias/meals/${mealId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.status === 409) {
        toast.error('Esta marmita já foi confirmada como entregue.')
        setMeals((prev) => prev.filter((m) => m.id !== mealId))
        return
      }
      if (res.status === 403) {
        toast.error('Refeição não pertence a esta marmitaria.')
        return
      }
      if (!res.ok) throw new Error()

      toast.success('Entrega confirmada com sucesso!')
      setMeals((prev) => prev.filter((m) => m.id !== mealId))
    } catch {
      toast.error('Erro ao confirmar entrega. Tente novamente.')
    } finally {
      setProcessingId(null)
      setConfirmingId(null)
    }
  }

  const handleCodeSubmit = async () => {
    const code = manualCode.trim()
    if (!code) return

    setProcessingCode(true)
    try {
      // Use placeholder `_` as meal ID — route detects code in body
      const res = await fetch('/api/v1/marmitarias/meals/_/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (res.status === 409) {
        toast.error('Esta marmita já foi confirmada como entregue.')
        return
      }
      if (res.status === 404 || res.status === 422) {
        toast.error('Código não encontrado ou inválido. Verifique e tente novamente.')
        return
      }
      if (!res.ok) throw new Error()

      toast.success('Entrega confirmada com sucesso!')
      setManualCode('')
      fetchMeals()
    } catch {
      toast.error('Erro ao confirmar entrega. Tente novamente.')
    } finally {
      setProcessingCode(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Entregas Pendentes
        </h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)]"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Entregas Pendentes{meals.length > 0 ? ` (${meals.length})` : ''}
      </h1>

      {/* Confirmar por código manual */}
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
        <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">
          Confirmar por código de retirada
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Digite o código"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            className="font-mono"
            maxLength={20}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCodeSubmit()
            }}
          />
          <Button
            onClick={handleCodeSubmit}
            disabled={processingCode || !manualCode.trim()}
          >
            {processingCode ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-1">Confirmar</span>
          </Button>
        </div>
      </div>

      {/* Lista de marmitas pendentes */}
      {meals.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Nenhuma marmita aguardando confirmação"
          description="Quando receptores usarem códigos de retirada, as marmitas aparecerão aqui."
        />
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-[var(--color-primary-raw)]" />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {meal.quantity} marmita{meal.quantity > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  ID: ...{meal.id.slice(-8)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Reservado em: {formatDateBr(meal.createdAt)}
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setConfirmingId(meal.id)}
                disabled={processingId === meal.id}
              >
                {processingId === meal.id ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Package className="mr-1 h-4 w-4" />
                )}
                Confirmar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmação */}
      <ConfirmDialog
        open={!!confirmingId}
        onOpenChange={(open) => {
          if (!open) setConfirmingId(null)
        }}
        title="Confirmar Entrega"
        description={`Confirmar que ${
          meals.find((m) => m.id === confirmingId)?.quantity ?? 1
        } marmita(s) foram entregues ao receptor?`}
        confirmLabel="Confirmar Entrega"
        onConfirm={() => {
          if (confirmingId) handleConfirmDelivery(confirmingId)
        }}
        isLoading={!!processingId}
      />
    </div>
  )
}
