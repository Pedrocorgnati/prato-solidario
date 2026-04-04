import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ImpactCounter } from "@/components/shared/impact-counter"
import { ROUTES } from "@/lib/constants"
import { Heart, Shield, Zap, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section data-testid="landing-hero" className="bg-[var(--color-primary-raw)]/5 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[var(--color-text-primary)] md:text-5xl">
              Transforme seu{" "}
              <span className="text-[var(--color-primary-raw)]">excedente</span>{" "}
              em solidariedade
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)]">
              Conectamos restaurantes, ongs e doadores com pessoas que precisam de
              refeições. Simples, rápido e com impacto real na sua comunidade.
            </p>
            <div data-testid="landing-hero-actions" className="flex flex-col gap-3 sm:flex-row">
              <Button data-testid="landing-hero-comecar-button" variant="default" size="lg" asChild>
                <Link href={ROUTES.ENTRAR}>
                  Começar agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button data-testid="landing-hero-como-funciona-button" variant="outline" size="lg" asChild>
                <Link href={ROUTES.COMO_FUNCIONA}>Como funciona</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden">
            {/* @ASSET_PLACEHOLDER
            name: hero-landing
            type: image
            extension: png
            aspect_ratio: 4:3
            dimensions: 600x450
            description: Foto inspiradora mostrando refeições sendo distribuídas com sorriso, calor humano, diversidade. Mesa farta, mãos entregando prato.
            context: Hero da landing page
            style: Fotografia real, warm tones
            mood: Acolhedor, solidário, positivo
            colors: tons quentes alinhados com brand green/orange
            avoid: Imagens tristes, fome aparente, drama excessivo
            */}
            <Image
              src="/images/hero-landing.png"
              alt="Refeições sendo distribuídas com carinho"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Impacto */}
      <section data-testid="landing-impact" className="py-16 bg-[var(--color-background-raw)]">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)] mb-10">
            Nosso impacto até hoje
          </h2>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <ImpactCounter value={12480} label="Refeições doadas" />
            <ImpactCounter value={3200} label="Famílias atendidas" />
            <ImpactCounter value={87} label="Restaurantes parceiros" />
            <ImpactCounter value={420} label="Kg de CO₂ evitados" suffix="kg" />
          </div>
        </div>
      </section>

      {/* Como funciona (resumo) */}
      <section data-testid="landing-how-it-works" className="py-16 bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)] mb-10">
            Simples para todos
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Heart className="h-8 w-8 text-[var(--color-secondary-raw)]" />,
                title: "Doadores publicam",
                desc: "Restaurantes e pessoas físicas publicam o que sobrou. Em segundos.",
              },
              {
                icon: <Zap className="h-8 w-8 text-[var(--color-primary-raw)]" />,
                title: "Receptores solicitam",
                desc: "Quem precisa solicita a refeição e recebe um código de retirada.",
              },
              {
                icon: <Shield className="h-8 w-8 text-[var(--color-info)]" />,
                title: "Impacto verificado",
                desc: "Cada doação confirmada gera um relatório de impacto transparente.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-6 space-y-3"
              >
                {item.icon}
                <h3 className="font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-testid="landing-cta" className="py-16 bg-[var(--color-primary-raw)]">
        <div className="mx-auto max-w-2xl px-4 text-center space-y-6">
          <h2 className="text-3xl font-extrabold text-white">
            Faça parte da corrente do bem
          </h2>
          <p className="text-[var(--color-on-primary)]/80">
            Seja você doador, receptor, marmitaria ou patrocinador, há um lugar para você.
          </p>
          <Button
            data-testid="landing-cta-cadastrar-button"
            variant="secondary"
            size="lg"
            asChild
            className="bg-white text-[var(--color-primary-raw)] hover:bg-white/90"
          >
            <Link href={ROUTES.ENTRAR}>Cadastrar agora — é grátis</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
