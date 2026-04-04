import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserRole, ROUTES } from "@/lib/constants"
import { Home, Plus, History, Star, Tag, User, Award } from "lucide-react"

const sidebarItems = [
  { href: ROUTES.DOADOR, label: "Início", icon: <Home className="h-4 w-4" /> },
  { href: ROUTES.DOADOR_NOVA, label: "Nova Doação", icon: <Plus className="h-4 w-4" /> },
  { href: ROUTES.DOADOR_SOBROU, label: "Sobrou!", icon: <Star className="h-4 w-4" /> },
  { href: ROUTES.DOADOR_CODIGOS, label: "Códigos", icon: <Tag className="h-4 w-4" /> },
  { href: ROUTES.DOADOR_IMPACTO, label: "Impacto", icon: <Award className="h-4 w-4" /> },
  { href: ROUTES.DOADOR_HISTORICO, label: "Histórico", icon: <History className="h-4 w-4" /> },
  { href: ROUTES.DOADOR_PERFIL, label: "Perfil", icon: <User className="h-4 w-4" /> },
]

export default function DoadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role={UserRole.DOADOR} sidebarItems={sidebarItems}>
      {children}
    </DashboardLayout>
  )
}
