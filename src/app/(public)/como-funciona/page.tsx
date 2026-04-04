import { Heart, Zap, Shield, ChefHat, Gift, Building2, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"

// RESOLVED: generateMetadata com description e openGraph
export const metadata = {
  title: "Como Funciona — Prato Solidário",
  description: "Entenda como o Prato Solidário conecta doadores, marmitarias e receptores de refeições em tempo real, de forma gratuita.",
  openGraph: {
    title: "Como Funciona — Prato Solidário",
    description: "Conectamos quem tem comida sobrando com quem precisa de uma refeição. Simples, rápido e com impacto real.",
  },
}

const steps = [
  {
    role: "Doador / Restaurante",
    icon: <Heart className="h-6 w-6" />,
    color: "bg-[var(--color-secondary-raw)]/10 text-[var(--color-secondary-raw)]",
    steps: [
      "Cadastre-se como doador ou restaurante",
      "Publique o que sobrou com foto, quantidade e horário",
      "Receba notificação quando alguém solicitar",
      "Confirme a retirada e acompanhe seu impacto",
    ],
  },
  {
    role: "Receptor",
    icon: <UtensilsCrossed className="h-6 w-6" />,
    color: "bg-[var(--color-primary-raw)]/10 text-[var(--color-primary-raw)]",
    steps: [
      "Cadastre-se rapidamente (1 etapa)",
      "Veja doações disponíveis perto de você",
      "Solicite a refeição com 1 toque",
      "Apresente o código e retire seu prato",
    ],
  },
  {
    role: "Marmitaria",
    icon: <ChefHat className="h-6 w-6" />,
    color: "bg-[var(--color-accent-raw)]/20 text-[var(--color-on-accent)]",
    steps: [
      "Cadastre sua marmitaria (6 etapas)",
      "Conecte sua conta Mercado Pago",
      "Receba patrocínios de marmitas solidárias",
      "Entregue marmitas e receba pagamento",
    ],
  },
  {
    role: "Patrocinador",
    icon: <Gift className="h-6 w-6" />,
    color: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    steps: [
      "Escolha uma marmitaria parceira",
      "Selecione quantas marmitas deseja patrocinar",
      "Pague via Pix ou cartão",
      "Acompanhe o impacto em tempo real",
    ],
  },
]

export default function ComoFuncionaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] md:text-4xl">
          Como funciona o Prato Solidário
        </h1>
        <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
          Uma plataforma para todos. Cada papel é importante na corrente do bem.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {steps.map((item) => (
          <div
            key={item.role}
            className="rounded-xl border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.color}`}>
                {item.icon}
              </div>
              <h2 className="font-bold text-[var(--color-text-primary)]">{item.role}</h2>
            </div>
            <ol className="space-y-2">
              {item.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-[var(--color-text-secondary)]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-xs font-bold text-[var(--color-text-primary)]">
                    {idx + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button variant="default" size="lg" asChild>
          <Link href={ROUTES.ENTRAR}>Começar agora</Link>
        </Button>
      </div>
    </div>
  )
}
