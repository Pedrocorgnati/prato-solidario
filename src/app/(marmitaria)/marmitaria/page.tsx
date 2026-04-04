"use client"

import * as React from "react"
import Link from "next/link"
import { CreditCard, Tag, Settings, Link2, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

const stats = [
  { label: "Marmitas vendidas", value: "142", icon: <ChefHat className="h-5 w-5" /> },
  { label: "Receber este mês", value: "R$ 1.278", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Patrocínios ativos", value: "8", icon: <Tag className="h-5 w-5" /> },
]

export default function MarmitariaDashboardPage() {
  return (
    <div data-testid="marmitaria-dashboard" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Minha Marmitaria</h1>
        <span className="rounded-full bg-[var(--color-success)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
          Ativa
        </span>
      </div>

      <div data-testid="marmitaria-stats" className="grid gap-3 md:grid-cols-3">
        {stats.map((stat) => {
          const slug = stat.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
          return (
          <div
            key={stat.label}
            data-testid={`marmitaria-stat-${slug}`}
            className="flex items-center gap-3 rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-raw)]/10 text-[var(--color-primary-raw)]">
              {stat.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
            </div>
          </div>
          )
        })}
      </div>

      <div data-testid="marmitaria-actions" className="grid gap-3 md:grid-cols-2">
        <Button data-testid="marmitaria-codigos-button" variant="outline" size="lg" asChild>
          <Link href={ROUTES.MARMITARIA_CODIGOS}>
            <Tag className="mr-2 h-5 w-5" />
            Ver códigos ativos
          </Link>
        </Button>
        <Button data-testid="marmitaria-pagamentos-button" variant="outline" size="lg" asChild>
          <Link href={ROUTES.MARMITARIA_PAGAMENTOS}>
            <CreditCard className="mr-2 h-5 w-5" />
            Pagamentos
          </Link>
        </Button>
        <Button data-testid="marmitaria-config-button" variant="outline" size="lg" asChild>
          <Link href={ROUTES.MARMITARIA_CONFIG}>
            <Settings className="mr-2 h-5 w-5" />
            Configurações
          </Link>
        </Button>
        <Button data-testid="marmitaria-mp-connect-button" variant="outline" size="lg" asChild>
          <Link href={ROUTES.MARMITARIA_MP_CONNECT}>
            <Link2 className="mr-2 h-5 w-5" />
            Mercado Pago
          </Link>
        </Button>
      </div>
    </div>
  )
}
