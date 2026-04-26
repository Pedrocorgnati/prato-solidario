import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { ContactForm } from "./ContactForm"

/**
 * PartnersSection — marmitarias parceiras (dados estáticos seed).
 * Server Component.
 * @see module-18-landing-page/TASK-1/ST004
 */

interface Partner {
  name: string
  city: string
}

const PARTNERS: Partner[] = [
  { name: "Marmitas da Vovó", city: "São Paulo, SP" },
  { name: "Sabor Solidário", city: "Rio de Janeiro, RJ" },
  { name: "Cozinha do Bem", city: "Belo Horizonte, MG" },
  { name: "Marmita Feliz", city: "Curitiba, PR" },
  { name: "Calor Humano", city: "Porto Alegre, RS" },
  { name: "Prato Cheio", city: "Fortaleza, CE" },
]

export function PartnersSection() {
  return (
    <section
      id="parceiros"
      data-testid="landing-partners"
      className="py-16 bg-[var(--color-surface)]"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          Marmitarias que apoiam
        </h2>
        <p className="text-center text-sm text-[var(--color-text-secondary)] mb-10">
          Estabelecimentos que transformam seu excedente em solidariedade todos os dias.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {PARTNERS.map((p) => (
            <div
              key={p.name}
              className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-5 py-3 text-center min-w-[140px]"
            >
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{p.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{p.city}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <Link
            data-testid="landing-partners-cadastro-link"
            href={ROUTES.CADASTRO_MARMITARIA}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-green-700 px-6 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors duration-200"
          >
            Seja uma marmitaria parceira
          </Link>
        </div>

        {/* Parceria Mercado Livre Solidário — TASK-20 */}
        <div className="mt-10 flex justify-center">
          <p className="text-xs text-[var(--color-text-muted)] text-center max-w-sm">
            Em parceria com o{" "}
            <span className="font-medium text-[var(--color-text-secondary)]">
              Mercado Livre Solidário
            </span>{" "}
            para ampliar o impacto da doação de alimentos no Brasil.
          </p>
        </div>

        {/* Formulário de contato para parceiros */}
        <div className="mt-12 mx-auto max-w-2xl">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 text-center">
            Fale Conosco
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">
            Tem interesse em ser parceiro? Envie uma mensagem e entraremos em contato.
          </p>
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
