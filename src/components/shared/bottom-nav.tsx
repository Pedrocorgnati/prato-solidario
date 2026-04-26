"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserRole } from "@/lib/constants"
import {
  Utensils,
  Home,
  History,
  User,
  Plus,
  Map,
  BookOpen,
  CreditCard,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const navByRole: Record<string, NavItem[]> = {
  [UserRole.RECEPTOR]: [
    { href: "/retirar", label: "Solicitar", icon: <Utensils className="h-5 w-5" /> },
    { href: "/retirar/proximos", label: "Próximos", icon: <Map className="h-5 w-5" /> },
    { href: "/retirar/historico", label: "Histórico", icon: <History className="h-5 w-5" /> },
    { href: "/perfil", label: "Conta", icon: <User className="h-5 w-5" /> },
  ],
  // RESOLVED: UserRole.DOADOR não existe — mapeado para DOADOR_PF e DOADOR_RESTAURANTE
  [UserRole.DOADOR_PF]: [
    { href: "/doador", label: "Início", icon: <Home className="h-5 w-5" /> },
    { href: "/doador/nova", label: "Publicar", icon: <Plus className="h-5 w-5" /> },
    { href: "/doador/historico", label: "Histórico", icon: <History className="h-5 w-5" /> },
    { href: "/perfil", label: "Perfil", icon: <User className="h-5 w-5" /> },
  ],
  [UserRole.DOADOR_RESTAURANTE]: [
    { href: "/doador", label: "Início", icon: <Home className="h-5 w-5" /> },
    { href: "/doador/nova", label: "Publicar", icon: <Plus className="h-5 w-5" /> },
    { href: "/doador/historico", label: "Histórico", icon: <History className="h-5 w-5" /> },
    { href: "/perfil", label: "Perfil", icon: <User className="h-5 w-5" /> },
  ],
  [UserRole.ONG]: [
    { href: "/doador", label: "Início", icon: <Home className="h-5 w-5" /> },
    { href: "/doador/nova", label: "Publicar", icon: <Plus className="h-5 w-5" /> },
    { href: "/doador/historico", label: "Histórico", icon: <History className="h-5 w-5" /> },
    { href: "/perfil", label: "Perfil", icon: <User className="h-5 w-5" /> },
  ],
  [UserRole.MARMITARIA]: [
    { href: "/marmitaria", label: "Painel", icon: <Home className="h-5 w-5" /> },
    { href: "/marmitaria/entregas", label: "Entregas", icon: <Utensils className="h-5 w-5" /> },
    { href: "/marmitaria/saldo", label: "Saldo", icon: <CreditCard className="h-5 w-5" /> },
    { href: "/marmitaria/pagamentos", label: "Pagamentos", icon: <History className="h-5 w-5" /> },
    { href: "/marmitaria/config", label: "Config", icon: <User className="h-5 w-5" /> },
  ],
}

interface BottomNavProps {
  role: UserRole
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()
  const items = navByRole[role] ?? []

  if (items.length === 0) return null

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-stretch border-t border-[var(--color-border-raw)] bg-[var(--color-background-raw)] safe-bottom md:hidden"
      aria-label="Navegação principal"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/")
        const slug = item.href.split("/").filter(Boolean).pop() ?? "home"
        return (
          <Link
            key={item.href}
            href={item.href}
            data-testid={`bottom-nav-item-${slug}`}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
              isActive
                ? "text-[var(--color-primary-raw)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="relative">
              {item.icon}
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-secondary-raw)] text-[9px] font-bold text-white">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
            </span>
            <span className="text-[10px] leading-none">{item.label}</span>
            {isActive && (
              <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[var(--color-primary-raw)]" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
