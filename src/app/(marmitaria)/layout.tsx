import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserRole, ROUTES } from "@/lib/constants"
import { Home, Tag, CreditCard, Settings, Link2 } from "lucide-react"

const sidebarItems = [
  { href: ROUTES.MARMITARIA, label: "Painel", icon: <Home className="h-4 w-4" /> },
  { href: ROUTES.MARMITARIA_CODIGOS, label: "Códigos", icon: <Tag className="h-4 w-4" /> },
  { href: ROUTES.MARMITARIA_PAGAMENTOS, label: "Pagamentos", icon: <CreditCard className="h-4 w-4" /> },
  { href: ROUTES.MARMITARIA_CONFIG, label: "Configurações", icon: <Settings className="h-4 w-4" /> },
  { href: ROUTES.MARMITARIA_MP_CONNECT, label: "Mercado Pago", icon: <Link2 className="h-4 w-4" /> },
]

export default function MarmitariaLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role={UserRole.MARMITARIA} sidebarItems={sidebarItems}>
      {children}
    </DashboardLayout>
  )
}
