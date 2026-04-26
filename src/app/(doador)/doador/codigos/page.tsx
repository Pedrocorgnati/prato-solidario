export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { listActiveCodes } from "@/actions/codes"
import { CodigosClient } from "./codigos-client"

export const metadata = { title: "Códigos Ativos — Prato Solidário" }

// ---------------------------------------------------------------------------
// Page — Server Component
// ---------------------------------------------------------------------------

export default function CodigosDoadorPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Códigos Ativos</h1>
      <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
        <CodigosContent />
      </Suspense>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CodigosContent — busca dados server-side e renderiza o client wrapper
// ---------------------------------------------------------------------------

async function CodigosContent() {
  const { data } = await listActiveCodes()

  return <CodigosClient codes={data} />
}
