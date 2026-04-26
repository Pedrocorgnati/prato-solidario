"use client"
export const dynamic = 'force-dynamic'

import Link from "next/link"
import { User, LogOut, Settings, Shield, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

// RESOLVED: /perfil ausente — link quebrado no BottomNav (RECEPTOR, DOADOR, ONG)
const menuItems = [
  {
    href: "#",
    icon: <Settings className="h-5 w-5" />,
    label: "Configurações da conta",
  },
  {
    href: ROUTES.PRIVACIDADE,
    icon: <Shield className="h-5 w-5" />,
    label: "Privacidade e dados (LGPD)",
  },
  {
    href: ROUTES.TERMOS,
    icon: <Shield className="h-5 w-5" />,
    label: "Termos de uso",
  },
]

export default function PerfilPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      {/* Avatar / nome */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-raw)]/10">
          <User className="h-8 w-8 text-[var(--color-primary-raw)]" />
        </div>
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">Meu perfil</p>
          <p className="text-sm text-[var(--color-text-muted)]">Carregando...</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="rounded-xl border border-[var(--color-border-raw)] divide-y divide-[var(--color-border-raw)]">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface)] transition-colors"
          >
            <div className="flex items-center gap-3 text-[var(--color-text-primary)]">
              <span className="text-[var(--color-text-muted)]">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
          </Link>
        ))}
      </nav>

      {/* Sair */}
      <Button variant="outline" size="lg" className="w-full text-[var(--color-danger)] border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/5" asChild>
        <Link href={ROUTES.LOGIN}>
          <LogOut className="mr-2 h-5 w-5" />
          Sair da conta
        </Link>
      </Button>
    </div>
  )
}
