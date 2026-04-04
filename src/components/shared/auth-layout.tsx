import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ROUTES } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
}

export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
  return (
    <div data-testid="auth-layout" className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-muted-raw)] px-4 py-8">
      <div className={cn("w-full max-w-md", className)}>
        <div className="mb-8 flex flex-col items-center text-center">
          <Link data-testid="auth-layout-logo" href={ROUTES.HOME} aria-label="Ir para início">
            {/* @ASSET_PLACEHOLDER
            name: logo-prato-solidario
            type: image
            extension: png
            aspect_ratio: 4.5:1
            dimensions: 180x40
            description: Logo principal do Prato Solidário
            context: Auth pages
            */}
            <Image
              src="/images/logo-prato-solidario.png"
              alt="Prato Solidário"
              width={180}
              height={40}
              className="h-12 w-auto"
            />
          </Link>
          {title && (
            <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
          )}
        </div>
        <div data-testid="auth-layout-card" className="rounded-xl border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-6 shadow-md">
          {children}
        </div>
      </div>
    </div>
  )
}
