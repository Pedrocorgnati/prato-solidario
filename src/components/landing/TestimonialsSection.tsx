/**
 * TestimonialsSection — depoimentos estáticos de doadores e receptores.
 * Server Component — sem interação.
 * @see module-18-landing-page/TASK-1/ST003
 */

interface Testimonial {
  name: string
  role: "doador" | "receptor"
  text: string
  city: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Carlos Mendes",
    role: "doador",
    text: "Todo dia sobrava comida no restaurante e eu me sentia mal em jogar fora. Com o Prato Solidário consegui transformar esse excedente em refeição para famílias reais. Simples assim.",
    city: "São Paulo, SP",
  },
  {
    name: "Ana Paula Ribeiro",
    role: "doador",
    text: "Cadastrei minha ONG e em menos de uma semana já estávamos conectados com doadores da região. A plataforma é muito fácil de usar, até para quem não tem familiaridade com tecnologia.",
    city: "Belo Horizonte, MG",
  },
  {
    name: "João da Silva",
    role: "receptor",
    text: "Consegui refeições para minha família em um momento muito difícil. O código de retirada foi simples, sem constrangimento. Obrigado a todos que doam.",
    city: "Rio de Janeiro, RJ",
  },
]

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

const ROLE_LABEL: Record<Testimonial["role"], string> = {
  doador: "Doador",
  receptor: "Receptor",
}

export function TestimonialsSection() {
  return (
    <section
      data-testid="landing-testimonials"
      className="py-16 bg-[var(--color-background-raw)]"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)] mb-10">
          Histórias reais de impacto
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="rounded-xl border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-6 space-y-4"
            >
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-800 text-sm font-bold shrink-0"
                >
                  {getInitials(t.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{t.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {ROLE_LABEL[t.role]} · {t.city}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
