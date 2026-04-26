import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-6">
      {/* Ilustração amigável */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-primary-raw)]/10">
        <svg
          className="h-12 w-12 text-[var(--color-primary-raw)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Prato vazio */}
          <ellipse cx="12" cy="13" rx="8" ry="3" />
          <path d="M4 13c0-4.4 3.6-8 8-8s8 3.6 8 8" />
          <line x1="12" y1="5" x2="12" y2="3" />
          <line x1="8" y1="6.5" x2="7" y2="4.8" />
          <line x1="16" y1="6.5" x2="17" y2="4.8" />
        </svg>
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Página não encontrada
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Não encontramos o que você estava procurando.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="default" size="lg" asChild>
          <Link href={ROUTES.HOME}>Voltar ao início</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href={ROUTES.RETIRAR}>Procurar alimentos</Link>
        </Button>
      </div>
    </div>
  )
}
