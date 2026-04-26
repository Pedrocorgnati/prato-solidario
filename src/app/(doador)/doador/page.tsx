export const dynamic = 'force-dynamic'
import { getDonorMetrics, listDonations } from "@/actions/donations"
import { requireSession } from "@/lib/auth/session"
import { UserRole } from "@/types/enums"
import { DashboardContent } from "./components/DashboardContent"

export const metadata = { title: "Painel do Doador — Prato Solidário" }

export default async function DoadorDashboardPage() {
  const [session, metrics, donationsResult] = await Promise.all([
    requireSession(),
    getDonorMetrics(),
    listDonations(),
  ])

  return (
    <DashboardContent
      metrics={metrics}
      donations={donationsResult.data}
      isRestaurante={session.role === UserRole.DOADOR_RESTAURANTE}
    />
  )
}
