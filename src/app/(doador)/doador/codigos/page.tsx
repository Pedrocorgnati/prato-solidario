"use client"

import * as React from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Badge } from "@/components/ui/badge"
import { CodeStatus } from "@/lib/constants"
import { Tag } from "lucide-react"

export default function CodigosDoadorPage() {
  const [loading] = React.useState(false)
  const mockCodes = [
    { code: "4829", status: CodeStatus.ATIVO, donation: "Marmitas de frango", time: "Retirar até 14:00" },
    { code: "3701", status: CodeStatus.CONFIRMADO, donation: "Sopa de legumes", time: "Retirado às 12:30" },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Códigos Ativos</h1>
      {loading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : mockCodes.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-8 w-8" />}
          title="Nenhum código ativo"
          description="Publique uma doação para ver os códigos gerados aqui."
        />
      ) : (
        <div className="space-y-3">
          {mockCodes.map((item) => (
            <div
              key={item.code}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4"
            >
              <div>
                <p className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
                  {item.code}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">{item.donation}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{item.time}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.status === CodeStatus.ATIVO
                    ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                    : "bg-[var(--color-info)]/10 text-[var(--color-info)]"
                }`}
              >
                {item.status === CodeStatus.ATIVO ? "Ativo" : "Confirmado"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
