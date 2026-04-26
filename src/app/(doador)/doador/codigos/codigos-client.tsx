"use client"

/**
 * CodigosClient — wrapper client para lista de códigos ativos do doador.
 * Recebe dados pré-carregados pelo server component pai.
 * @see module-10-codigos-historico/TASK-5/ST001
 */

import { EmptyState } from "@/components/ui/empty-state"
import { Tag } from "lucide-react"
import { CodigoItem } from "./components/CodigoItem"
import type { RetrievalCodeWithDonation } from "@/repositories/retrieval.repository"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CodigosClientProps {
  codes: RetrievalCodeWithDonation[]
}

// ---------------------------------------------------------------------------
// CodigosClient
// ---------------------------------------------------------------------------

export function CodigosClient({ codes }: CodigosClientProps) {
  if (codes.length === 0) {
    return (
      <EmptyState
        icon={<Tag className="h-8 w-8" />}
        title="Nenhum código ativo"
        description="Publique uma doação para ver os códigos gerados aqui."
      />
    )
  }

  return (
    <div className="space-y-3">
      {codes.map((item) => (
        <CodigoItem key={item.id} item={item} />
      ))}
    </div>
  )
}
