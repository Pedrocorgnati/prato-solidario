import { getAdminStats } from "@/actions/admin"
import { Users, ChefHat, AlertTriangle, Gift } from "lucide-react"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"

export const metadata = { title: "Admin Dashboard — Prato Solidário" }

export default async function AdminDashboardPage() {
  const { data: stats } = await getAdminStats()

  const cards = [
    { label: "Total usuários", value: stats?.totalUsers ?? 0, icon: <Users className="h-6 w-6" />, href: ROUTES.ADMIN_USUARIOS, color: "text-[var(--color-info)]" },
    { label: "Marmitarias ativas", value: stats?.activeMarmitarias ?? 0, icon: <ChefHat className="h-6 w-6" />, href: ROUTES.ADMIN_MARMITARIAS, color: "text-[var(--color-primary-raw)]" },
    { label: "Incidentes pendentes", value: stats?.pendingIncidents ?? 0, icon: <AlertTriangle className="h-6 w-6" />, href: ROUTES.ADMIN_INCIDENTES, color: "text-[var(--color-warning)]" },
    { label: "Refeições doadas", value: stats?.totalMealsDelivered ?? 0, icon: <Gift className="h-6 w-6" />, href: ROUTES.ADMIN, color: "text-[var(--color-secondary-raw)]" },
  ]

  return (
    <div data-testid="admin-dashboard" className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard Admin</h1>
      <div data-testid="admin-stats" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => {
          const slug = card.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
          return (
          <Link
            key={card.label}
            href={card.href}
            data-testid={`admin-stat-${slug}`}
            className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4 space-y-2 hover:shadow-md transition-shadow"
          >
            <div className={card.color}>{card.icon}</div>
            <p className={`text-3xl font-extrabold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{card.label}</p>
          </Link>
          )
        })}
      </div>
      <div data-testid="admin-alerts" className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4">
        <h2 className="font-semibold text-[var(--color-warning)] mb-2">Alertas pendentes</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Nenhum alerta crítico no momento.</p>
      </div>
    </div>
  )
}
