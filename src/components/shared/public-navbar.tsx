"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ROUTES, UserRole } from "@/lib/constants"
import { useAuth } from "@/hooks/useAuth"
import { DarkModeToggle } from "@/components/shared/dark-mode-toggle"

const navLinks = [
  { href: ROUTES.RETIRAR, label: "Retirar alimentos" },
  { href: ROUTES.PATROCINAR, label: "Patrocinar" },
  { href: ROUTES.COMO_FUNCIONA, label: "Como Funciona" },
]

// RESOLVED: UserRole.DOADOR e VOLUNTARIO não existem — mapeado para valores reais do Prisma
const DASHBOARD_BY_ROLE: Record<string, string> = {
  [UserRole.DOADOR_PF]: ROUTES.DOADOR,
  [UserRole.DOADOR_RESTAURANTE]: ROUTES.DOADOR,
  [UserRole.ONG]: ROUTES.DOADOR,
  [UserRole.RECEPTOR]: ROUTES.RETIRAR,
  [UserRole.MARMITARIA]: ROUTES.MARMITARIA,
  [UserRole.PATROCINADOR]: ROUTES.PATROCINAR,
  [UserRole.ADMIN]: ROUTES.ADMIN,
}

export function PublicNavbar() {
  const { user, isLoading, signOut } = useAuth()

  const dashboardHref = user
    ? (DASHBOARD_BY_ROLE[user.role as string] ?? ROUTES.ENTRAR)
    : ROUTES.ENTRAR

  return (
    <header
      data-testid="public-header"
      id="main-nav"
      className="sticky top-0 z-30 border-b border-[var(--color-border-raw)] bg-[var(--color-background-raw)]/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link data-testid="public-header-logo" href={ROUTES.HOME} className="flex items-center gap-2">
          {/* @ASSET_PLACEHOLDER
          name: logo-prato-solidario
          type: image
          extension: png
          aspect_ratio: 4.5:1
          dimensions: 180x40
          description: Logo principal do Prato Solidário. Ícone de prato/refeição combinado com coração ou mãos, traços suaves. Ao lado do nome "Prato Solidário" em tipografia humanista. Fundo transparente.
          context: Header público, sidebar, footer, splash screen
          style: Flat, minimalista, traços arredondados
          mood: Acolhedor, humano, solidário
          colors: primary (#2D8659), branco
          elements: Prato, coração ou mãos, tipografia Plus Jakarta Sans
          avoid: Gradientes pesados, sombras excessivas, complexidade
          */}
          <Image
            src="/images/logo-prato-solidario.png"
            alt="Prato Solidário"
            width={180}
            height={40}
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav data-testid="public-header-nav" aria-label="Navegação principal" className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const slug = link.href.split("/").filter(Boolean).pop() ?? "home"
            return (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`public-header-nav-item-${slug}`}
                className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div data-testid="public-header-actions" className="hidden md:flex items-center gap-2">
          <DarkModeToggle />
          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link
                    data-testid="public-header-painel-button"
                    href={dashboardHref}
                    className="inline-flex h-10 items-center justify-center px-4 rounded-md text-sm font-medium hover:bg-[var(--color-muted-raw)] transition-colors"
                  >
                    Meu painel
                  </Link>
                  <Button
                    data-testid="public-header-sair-button"
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    data-testid="public-header-entrar-button"
                    href={ROUTES.LOGIN}
                    className="inline-flex h-10 items-center justify-center px-4 rounded-md text-sm font-medium hover:bg-[var(--color-muted-raw)] transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    data-testid="public-header-comecar-button"
                    href={ROUTES.ENTRAR}
                    className="inline-flex h-10 items-center justify-center px-4 rounded-md text-sm font-medium bg-[var(--color-primary-raw)] text-white hover:bg-[var(--color-primary-hover)] transition-colors"
                  >
                    Começar
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <DarkModeToggle />
          <Sheet>
            <SheetTrigger>
              <span
                data-testid="public-header-mobile-menu-button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-[var(--color-muted-raw)]"
                aria-label="Abrir menu de navegação"
                role="button"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </span>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div data-testid="public-header-mobile-menu" className="flex flex-col gap-4 pt-4">
                <Link href={ROUTES.HOME} className="flex items-center gap-2">
                  <Image
                    src="/images/logo-prato-solidario.png"
                    alt="Prato Solidário"
                    width={140}
                    height={32}
                    className="h-7 w-auto"
                  />
                </Link>
                <Separator />
                <nav data-testid="public-header-mobile-nav" aria-label="Navegação mobile" className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const slug = link.href.split("/").filter(Boolean).pop() ?? "home"
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        data-testid={`public-header-mobile-nav-item-${slug}`}
                        className="flex h-10 items-center rounded-md px-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </nav>
                <Separator />
                <div data-testid="public-header-mobile-actions" className="flex flex-col gap-2">
                  {!isLoading && (
                    <>
                      {user ? (
                        <>
                          <Link
                            href={dashboardHref}
                            className="flex h-10 items-center justify-center rounded-md border border-[var(--color-border-raw)] text-sm font-medium hover:bg-[var(--color-muted-raw)] transition-colors"
                          >
                            Meu painel
                          </Link>
                          <button
                            onClick={() => signOut()}
                            className="flex h-10 items-center justify-center rounded-md border border-[var(--color-border-raw)] text-sm font-medium hover:bg-[var(--color-muted-raw)] transition-colors"
                          >
                            Sair
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            data-testid="public-header-mobile-entrar-button"
                            href={ROUTES.LOGIN}
                            className="flex h-10 items-center justify-center rounded-md border border-[var(--color-border-raw)] text-sm font-medium hover:bg-[var(--color-muted-raw)] transition-colors"
                          >
                            Entrar
                          </Link>
                          <Link
                            data-testid="public-header-mobile-comecar-button"
                            href={ROUTES.ENTRAR}
                            className="flex h-10 items-center justify-center rounded-md bg-[var(--color-primary-raw)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
                          >
                            Começar Agora
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
