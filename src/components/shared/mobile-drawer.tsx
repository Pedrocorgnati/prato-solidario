"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

interface DrawerItem {
  href: string
  label: string
  icon?: React.ReactNode
}

const adminItems: DrawerItem[] = [
  { href: ROUTES.ADMIN, label: "Dashboard" },
  { href: ROUTES.ADMIN_USUARIOS, label: "Usuários" },
  { href: ROUTES.ADMIN_MARMITARIAS, label: "Marmitarias" },
  { href: ROUTES.ADMIN_DENUNCIAS, label: "Denúncias" },
  { href: ROUTES.ADMIN_INCIDENTES, label: "Incidentes" },
  { href: ROUTES.ADMIN_BANNERS, label: "Banners" },
  { href: ROUTES.ADMIN_PARCEIROS, label: "Parceiros" },
]

export function MobileDrawer() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <Button
        data-testid="mobile-drawer-open-button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div
        data-testid="mobile-drawer"
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[85vw] max-w-xs bg-[var(--color-background-raw)] shadow-lg transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal
        aria-label="Menu de administração"
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border-raw)] px-4">
          <span className="font-bold text-[var(--color-text-primary)]">Admin</span>
          <Button
            data-testid="mobile-drawer-close-button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav data-testid="mobile-drawer-nav" className="flex flex-col gap-1 p-4">
          {adminItems.map((item) => {
            const isActive = pathname === item.href
            const slug = item.href.split("/").filter(Boolean).pop() ?? "dashboard"
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`mobile-drawer-nav-item-${slug}`}
                className={cn(
                  "flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-primary-raw)] text-white"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
