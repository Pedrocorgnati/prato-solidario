"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  Store,
  Flag,
  AlertTriangle,
  Image as ImageIcon,
  Package,
  Handshake,
  ShieldCheck,
} from "lucide-react"
import { MobileDrawer } from "@/components/shared/mobile-drawer"
import { NotificationBell } from "@/components/admin/NotificationBell"
import { ROUTES } from "@/lib/constants"
import { cn } from "@/lib/utils"

const adminItems = [
  { href: ROUTES.ADMIN_DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.ADMIN_USUARIOS, label: "Usuários", icon: Users },
  { href: ROUTES.ADMIN_MARMITARIAS, label: "Marmitarias", icon: Store },
  { href: ROUTES.ADMIN_DENUNCIAS, label: "Denúncias", icon: Flag },
  { href: ROUTES.ADMIN_INCIDENTES, label: "Incidentes", icon: AlertTriangle },
  { href: ROUTES.ADMIN_BANNERS, label: "Banners", icon: ImageIcon },
  { href: ROUTES.ADMIN_PARCEIROS, label: "Parceiros", icon: Handshake },
  { href: ROUTES.ADMIN_MARMITAS_ACUMULADAS, label: "Marmitas Acumuladas", icon: Package },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside data-testid="admin-sidebar" className="hidden md:flex flex-col w-64 shrink-0 border-r border-[var(--color-border-raw)] bg-[var(--color-surface)]">
        <div data-testid="admin-sidebar-brand" className="flex h-16 items-center px-4 border-b border-[var(--color-border-raw)]">
          <span className="font-bold text-lg text-[var(--color-text-primary)]">
            Painel Admin
          </span>
        </div>
        <nav data-testid="admin-sidebar-nav" aria-label="Menu de administração" className="flex flex-col gap-1 p-3 flex-1">
          {adminItems.map((item) => {
            const isActive = pathname === item.href
            const slug = item.href.split("/").filter(Boolean).pop() ?? "dashboard"
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`admin-sidebar-nav-item-${slug}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-primary-raw)] text-white"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-border-raw)]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div data-testid="admin-sidebar-user" className="flex items-center gap-2 border-t border-[var(--color-border-raw)] p-3">
          <ShieldCheck className="h-5 w-5 text-[var(--color-text-muted)]" aria-hidden="true" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">Admin</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header data-testid="admin-header" className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-4">
          <MobileDrawer />
          <Link data-testid="admin-header-logo" href={ROUTES.HOME}>
            <Image
              src="/images/logo-prato-solidario.png"
              alt="Prato Solidário"
              width={120}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <span className="text-sm font-medium text-[var(--color-text-muted)] md:hidden">
            Admin
          </span>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <main data-testid="admin-main" id="main" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
