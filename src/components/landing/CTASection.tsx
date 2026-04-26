import Link from "next/link"
import { ROUTES } from "@/lib/constants"

/**
 * CTASection — call-to-action final da landing page.
 * Server Component.
 * @see module-18-landing-page/TASK-1/ST005
 */
export function CTASection() {
  return (
    <section
      data-testid="landing-cta"
      className="py-16 bg-green-50"
    >
      <div className="mx-auto max-w-2xl px-4 text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)]">
          Pronto para fazer a diferença?
        </h2>
        <p className="text-[var(--color-text-secondary)]">
          Cada refeição conta. Cada doação transforma.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            data-testid="landing-cta-doador-button"
            href={ROUTES.CADASTRO_DOADOR}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-green-700 px-6 text-sm font-semibold text-white hover:bg-green-800 transition-colors duration-200"
          >
            Cadastre-se como Doador
          </Link>
          <Link
            data-testid="landing-cta-retirar-button"
            href={ROUTES.RETIRAR}
            className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-green-700 px-6 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors duration-200"
          >
            Encontrar Doações
          </Link>
        </div>
      </div>
    </section>
  )
}
