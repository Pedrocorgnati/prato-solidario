export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserRole, ROUTES, MarmitariaStatus } from "@/lib/constants"
import { Home, Package, BarChart3, CreditCard, Settings, Link2 } from "lucide-react"
import { getServerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { MpStatusBanner } from "@/components/marmitaria/mp-status-banner"

const sidebarItems = [
  { href: ROUTES.MARMITARIA, label: "Painel", icon: <Home className="h-4 w-4" /> },
  { href: ROUTES.MARMITARIA_ENTREGAS, label: "Entregas", icon: <Package className="h-4 w-4" /> },
  { href: ROUTES.MARMITARIA_SALDO, label: "Saldo", icon: <BarChart3 className="h-4 w-4" /> },
  { href: ROUTES.MARMITARIA_PAGAMENTOS, label: "Pagamentos", icon: <CreditCard className="h-4 w-4" /> },
  { href: ROUTES.MARMITARIA_CONFIG, label: "Configurações", icon: <Settings className="h-4 w-4" /> },
  { href: ROUTES.MARMITARIA_MP_CONNECT, label: "Mercado Pago", icon: <Link2 className="h-4 w-4" /> },
]

// Status pages that should NOT trigger a redirect loop
const STATUS_PAGES = ['/marmitaria/aguardando', '/marmitaria/rejeitada', '/marmitaria/suspensa']

export default async function MarmitariaLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  if (!session) {
    redirect('/entrar')
  }

  // Check current path to avoid redirect loops on status pages
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''
  const isStatusPage = STATUS_PAGES.some(p => pathname.startsWith(p))

  // Only check status and redirect if NOT already on a status page
  if (!isStatusPage) {
    const profile = await prisma.marmitariaProfile.findUnique({
      where: { userId: session.id },
      select: { status: true },
    })

    if (profile) {
      const status = profile.status as string
      if (status === MarmitariaStatus.PENDING_APPROVAL) {
        redirect(ROUTES.MARMITARIA_AGUARDANDO)
      }
      if (status === MarmitariaStatus.INACTIVE) {
        redirect(ROUTES.MARMITARIA_REJEITADA)
      }
      if (status === MarmitariaStatus.SUSPENDED) {
        redirect(ROUTES.MARMITARIA_SUSPENSA)
      }
    }
  }

  return (
    <DashboardLayout role={UserRole.MARMITARIA} sidebarItems={sidebarItems}>
      <div className="mb-4">
        <MpStatusBanner />
      </div>
      {children}
    </DashboardLayout>
  )
}
