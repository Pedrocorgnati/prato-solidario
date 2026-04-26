export const dynamic = 'force-dynamic'
/**
 * Painel ONG — Histórico de Códigos
 * Server Component que carrega dados iniciais e passa para o client wrapper.
 * @see module-10-codigos-historico/TASK-7/ST001
 */

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth/session"
import { retrievalRepository } from "@/repositories/retrieval.repository"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { HistoricoOngClient } from "./historico-ong-client"

export const metadata = { title: "Painel ONG — Histórico · Prato Solidário" }

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HistoricoOngPage() {
  return (
    <div className="px-4 py-6 space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Histórico de Códigos</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Consulte o histórico de retiradas realizadas pelos beneficiários da sua ONG.
        </p>
      </div>
      <Suspense fallback={<LoadingSkeleton variant="table-row" count={6} />}>
        <HistoricoOngContent />
      </Suspense>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HistoricoOngContent — busca dados iniciais server-side
// ---------------------------------------------------------------------------

async function HistoricoOngContent() {
  const session = await getServerSession()
  if (!session) redirect("/acesso-negado")

  const initialData = await retrievalRepository.getCodeHistoryByOngId(session.id, {
    page: 1,
    pageSize: 20,
  })

  return <HistoricoOngClient initialData={initialData} />
}
