"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BottomNav } from "@/components/shared/bottom-nav"
import { UserRole, ROUTES } from "@/lib/constants"
import { Bell, LogOut } from "lucide-react"
// RESOLVED: href={ROUTES.HOME} hardcoded → ROUTES.HOME
import { Button } from "@/components/ui/button"

interface SidebarItem {
  href: string
  label: string
  icon?: React.ReactNode
}

interface DashboardLayoutProps {
  children: React.ReactNode
  role: UserRole
  sidebarItems: SidebarItem[]
  userName?: string
}

export function DashboardLayout({
  children,
  role,
  sidebarItems,
  userName,
}: DashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-[var(--color-background-raw)]">
      {/* Sidebar — desktop only */}
      <aside data-testid="sidebar" className="hidden md:flex flex-col w-64 shrink-0 border-r border-[var(--color-border-raw)] bg-[var(--color-surface)]">
        <div data-testid="sidebar-logo" className="flex h-16 items-center px-4 border-b border-[var(--color-border-raw)]">
          <Link href={ROUTES.HOME}>
            {/* @ASSET_PLACEHOLDER
            name: logo-prato-solidario
            type: image
            extension: png
            aspect_ratio: 4.5:1
            dimensions: 180x40
            description: Logo principal do Prato Solidário
            context: Sidebar
            */}
            <Image
              src="/images/logo-prato-solidario.png"
              alt="Prato Solidário"
              width={140}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>
        <nav data-testid="sidebar-nav" className="flex flex-col gap-1 p-3 flex-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const slug = item.href.split("/").filter(Boolean).pop() ?? "home"
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`sidebar-nav-item-${slug}`}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-primary-raw)] text-white"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-border-raw)]"
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div data-testid="sidebar-footer" className="border-t border-[var(--color-border-raw)] p-3">
          {userName && (
            <p data-testid="sidebar-user-name" className="truncate px-3 text-xs text-[var(--color-text-muted)] mb-1">{userName}</p>
          )}
          <Button data-testid="sidebar-logout-button" variant="ghost" size="md" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar — mobile */}
        <header data-testid="header" className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-4 md:px-6">
          <Link data-testid="header-logo" href={ROUTES.HOME} className="md:hidden">
            <Image
              src="/images/logo-prato-solidario.png"
              alt="Prato Solidário"
              width={120}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <div className="hidden md:block" />
          <div data-testid="header-actions" className="flex items-center gap-2">
            <Button data-testid="header-notifications-button" variant="ghost" size="icon" aria-label="Notificações">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main data-testid="main-content" id="main" className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <BottomNav role={role} />
    </div>
  )
}
