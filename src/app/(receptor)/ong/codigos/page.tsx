/**
 * Painel ONG — Códigos Ativos
 * Server Component que carrega os dados e passa para o client wrapper.
 * @see module-10-codigos-historico/TASK-6/ST002
 */

import { Suspense } from "react"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { getServerSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { retrievalRepository } from "@/repositories/retrieval.repository"
import { CodigosOngClient } from "./codigos-ong-client"

export const dynamic = 'force-dynamic'
export const metadata = { title: "Painel ONG — Códigos Ativos · Prato Solidário" }

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CodigosOngPage() {
  return (
    <div className="px-4 py-6 space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Códigos Ativos</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Gerencie os códigos de retirada dos beneficiários da sua ONG.
        </p>
      </div>
      <Suspense fallback={<LoadingSkeleton variant="table-row" count={5} />}>
        <CodigosOngContent />
      </Suspense>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CodigosOngContent — busca dados server-side
// ---------------------------------------------------------------------------

async function CodigosOngContent() {
  const session = await getServerSession()
  if (!session) redirect("/acesso-negado")

  const codes = await retrievalRepository.getActiveCodesByOngId(session.id)

  return <CodigosOngClient codes={codes} />
}
