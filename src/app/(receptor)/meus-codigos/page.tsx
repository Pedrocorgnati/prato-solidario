"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { WithdrawalCodeDisplay } from "@/components/shared/withdrawal-code-display"
import { Badge } from "@/components/ui/badge"
import { RetrievalCodeStatus } from "@/lib/constants"
import { listActiveCodes } from "@/actions/codes"
import { Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"
import { BlockStatusBanner } from "@/components/receptor/block-status-banner"

export default function MeusCodigosPage() {
  const [loading, setLoading] = React.useState(true)
  const [codes, setCodes] = React.useState<unknown[]>([])
  const router = useRouter()

  React.useEffect(() => {
    listActiveCodes().then((r) => {
      setCodes(r.data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 space-y-4">
      <BlockStatusBanner />
      <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Meus Códigos</h1>
      {loading ? (
        <LoadingSkeleton variant="card" count={2} />
      ) : codes.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-8 w-8" />}
          title="Nenhum código ativo"
          description="Solicite uma refeição para receber seu código de retirada."
          action={{ label: "Solicitar refeição", onClick: () => router.push(ROUTES.RETIRAR) }}
        />
      ) : (
        codes.map((_, idx) => (
          <WithdrawalCodeDisplay
            key={idx}
            code={`${4800 + idx}`}
            status={RetrievalCodeStatus.ACTIVE}
            address="Restaurante Exemplo — Rua das Flores, 123"
            windowStart="12:00"
            windowEnd="14:00"
          />
        ))
      )}
    </div>
  )
}
