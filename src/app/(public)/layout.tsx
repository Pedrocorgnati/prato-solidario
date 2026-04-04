import { PublicNavbar } from "@/components/shared/public-navbar"
import Link from "next/link"
import Image from "next/image"
import { ROUTES } from "@/lib/constants"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-[var(--color-border-raw)] bg-[var(--color-surface)] py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <Link href={ROUTES.HOME}>
              {/* @ASSET_PLACEHOLDER
              name: logo-prato-solidario
              type: image
              extension: png
              dimensions: 140x32
              description: Logo Prato Solidário para footer
              */}
              <Image
                src="/images/logo-prato-solidario.png"
                alt="Prato Solidário"
                width={140}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
              <Link href={ROUTES.COMO_FUNCIONA} className="hover:text-[var(--color-text-primary)]">Como Funciona</Link>
              <Link href={ROUTES.TERMOS} className="hover:text-[var(--color-text-primary)]">Termos de Uso</Link>
              <Link href={ROUTES.PRIVACIDADE} className="hover:text-[var(--color-text-primary)]">Privacidade</Link>
            </nav>
            <p className="text-xs text-[var(--color-text-muted)]">
              © {new Date().getFullYear()} Prato Solidário. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
