"use client"

import * as React from "react"
import { UserPlus, Heart, MapPin } from "lucide-react"

/**
 * HowItWorks — seção "Como funciona" com tabs doador/receptor.
 * Client Component (useState para toggle).
 * @see module-18-landing-page/TASK-1/ST002
 */

const STEPS = {
  doador: [
    {
      icon: <UserPlus className="h-8 w-8 text-green-600" aria-hidden="true" />,
      title: "Cadastre-se como doador",
      desc: "Crie sua conta em minutos. Restaurante, ONG ou pessoa física — todos podem doar.",
    },
    {
      icon: <Heart className="h-8 w-8 text-green-600" aria-hidden="true" />,
      title: "Registre sua doação",
      desc: "Informe o que sobrou, quantidade e horário disponível para retirada.",
    },
    {
      icon: <MapPin className="h-8 w-8 text-green-600" aria-hidden="true" />,
      title: "Alguém retira e você ganha impacto",
      desc: "Você recebe confirmação, relatório de impacto e entra na corrente do bem.",
    },
  ],
  receptor: [
    {
      icon: <UserPlus className="h-8 w-8 text-green-600" aria-hidden="true" />,
      title: "Cadastre-se como receptor",
      desc: "Crie sua conta rapidamente. Nenhum documento obrigatório para começar.",
    },
    {
      icon: <MapPin className="h-8 w-8 text-green-600" aria-hidden="true" />,
      title: "Veja doações disponíveis próximas",
      desc: "Encontre refeições perto de você em tempo real, sem precisar de login.",
    },
    {
      icon: <Heart className="h-8 w-8 text-green-600" aria-hidden="true" />,
      title: "Retire com código único",
      desc: "Receba um código de retirada seguro e confirme a entrega para ambos os lados.",
    },
  ],
} as const

type Tab = "doador" | "receptor"

export function HowItWorks() {
  const [activeTab, setActiveTab] = React.useState<Tab>("doador")

  return (
    <section
      data-testid="landing-how-it-works"
      className="py-16 bg-[var(--color-surface)]"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)] mb-8">
          Como funciona
        </h2>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Selecione o perfil"
          className="flex justify-center gap-2 mb-10"
        >
          {(["doador", "receptor"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`panel-${tab}`}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={[
                "px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200",
                activeTab === tab
                  ? "bg-green-700 text-white"
                  : "border border-green-700 text-green-700 hover:bg-green-50",
              ].join(" ")}
            >
              {tab === "doador" ? "Sou Doador" : "Sou Receptor"}
            </button>
          ))}
        </div>

        {/* Steps — both panels in DOM for screen reader discoverability */}
        {(["doador", "receptor"] as const).map((tab) => (
          <div
            key={tab}
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            hidden={activeTab !== tab}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 transition-opacity duration-200 motion-reduce:transition-none"
          >
            {STEPS[tab].map((step, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-6 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-800 text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  {step.icon}
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">{step.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{step.desc}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
