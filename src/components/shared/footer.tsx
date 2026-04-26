import Link from 'next/link'
import Image from 'next/image'
import { ROUTES } from '@/lib/constants'

/**
 * Footer público com 3 colunas: Sobre, Links, Redes Sociais.
 * Server Component — sem interação.
 * @see module-7-layout-navigation/TASK-2/ST003
 */
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      role="contentinfo"
      data-testid="footer"
      className="border-t border-[var(--color-border-raw)] bg-[var(--color-surface)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Coluna 1 — Sobre */}
          <div className="flex flex-col gap-3">
            <Link href={ROUTES.HOME} aria-label="Prato Solidário — página inicial">
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
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xs">
              Uma plataforma de conexão solidária que transforma excedente de alimentos em refeições para quem precisa.
            </p>
          </div>

          {/* Coluna 2 — Links */}
          <nav aria-label="Links do rodapé" className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
              Links
            </p>
            <Link
              href={ROUTES.COMO_FUNCIONA}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Como Funciona
            </Link>
            <Link
              href={ROUTES.TERMOS}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Termos de Uso
            </Link>
            <Link
              href={ROUTES.PRIVACIDADE}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Política de Privacidade
            </Link>
            <Link
              href={ROUTES.COMO_FUNCIONA}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Dúvidas Frequentes
            </Link>
          </nav>

          {/* Coluna 3 — Redes Sociais */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
              Redes Sociais
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/pratosolidario"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Prato Solidário no Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border-raw)] text-[var(--color-text-muted)] hover:text-[var(--color-primary-raw)] hover:border-[var(--color-primary-raw)] transition-colors"
              >
                {/* Instagram SVG */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/pratosolidario"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Prato Solidário no LinkedIn"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border-raw)] text-[var(--color-text-muted)] hover:text-[var(--color-primary-raw)] hover:border-[var(--color-primary-raw)] transition-colors"
              >
                {/* LinkedIn SVG */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Prato Solidário no WhatsApp"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border-raw)] text-[var(--color-text-muted)] hover:text-[var(--color-primary-raw)] hover:border-[var(--color-primary-raw)] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--color-border-raw)] pt-6">
          <p className="text-center text-xs text-[var(--color-text-muted)]">
            © {year} Prato Solidário. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
