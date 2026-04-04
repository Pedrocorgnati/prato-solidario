"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ROUTES } from "@/lib/constants"

const navLinks = [
  { href: ROUTES.COMO_FUNCIONA, label: "Como Funciona" },
  { href: ROUTES.HALL_DA_FAMA, label: "Hall da Fama" },
]

export function PublicNavbar() {
  return (
    <header data-testid="public-header" className="sticky top-0 z-30 border-b border-[var(--color-border-raw)] bg-[var(--color-background-raw)]/95 backdrop-blur-sm">
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
        <nav data-testid="public-header-nav" className="hidden md:flex items-center gap-6">
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

        <div data-testid="public-header-actions" className="hidden md:flex items-center gap-3">
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
        </div>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger>
            <span data-testid="public-header-mobile-menu-button" className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-[var(--color-muted-raw)] md:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
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
              <nav data-testid="public-header-mobile-nav" className="flex flex-col gap-1">
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
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
