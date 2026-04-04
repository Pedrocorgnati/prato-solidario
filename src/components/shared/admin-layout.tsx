"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { MobileDrawer } from "@/components/shared/mobile-drawer"
import { ROUTES } from "@/lib/constants"
import { cn } from "@/lib/utils"

const adminItems = [
  { href: ROUTES.ADMIN, label: "Dashboard" },
  { href: ROUTES.ADMIN_USUARIOS, label: "Usuários" },
  { href: ROUTES.ADMIN_MARMITARIAS, label: "Marmitarias" },
  { href: ROUTES.ADMIN_DENUNCIAS, label: "Denúncias" },
  { href: ROUTES.ADMIN_INCIDENTES, label: "Incidentes" },
  { href: ROUTES.ADMIN_BANNERS, label: "Banners" },
  { href: ROUTES.ADMIN_PARCEIROS, label: "Parceiros" },
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
            Admin Panel
          </span>
        </div>
        <nav data-testid="admin-sidebar-nav" className="flex flex-col gap-1 p-3 flex-1">
          {adminItems.map((item) => {
            const isActive = pathname === item.href
            const slug = item.href.split("/").filter(Boolean).pop() ?? "dashboard"
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`admin-sidebar-nav-item-${slug}`}
                className={cn(
                  "flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-primary-raw)] text-white"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-border-raw)]"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
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
        </header>
        <main data-testid="admin-main" id="main" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
