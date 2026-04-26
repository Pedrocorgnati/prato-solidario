import Image from "next/image"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"

/**
 * HeroSection — seção hero da landing page.
 * Server Component — sem interação direta.
 * @see module-18-landing-page/TASK-1/ST001
 */
export function HeroSection() {
  return (
    <section
      data-testid="landing-hero"
      className="bg-green-700 text-white py-16 md:py-24 min-h-[60dvh] flex items-center"
    >
      <div className="mx-auto max-w-6xl px-4 grid gap-8 md:grid-cols-2 md:items-center w-full">
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Conectando quem tem com quem precisa
          </h1>
          <p className="text-lg text-white/85 max-w-md">
            Plataforma gratuita que transforma excedente de alimentos em refeições para quem precisa.
            Doe, retire ou apoie — cada refeição conta.
          </p>
          <div
            data-testid="landing-hero-actions"
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Link
              data-testid="landing-hero-doar-button"
              href={ROUTES.CADASTRO_DOADOR}
              className="inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-semibold bg-white text-green-800 hover:bg-green-50 transition-colors duration-200"
            >
              Quero Doar
            </Link>
            <Link
              data-testid="landing-hero-retirar-button"
              href={ROUTES.RETIRAR}
              className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-white px-6 text-sm font-semibold text-white hover:bg-white/10 transition-colors duration-200"
            >
              Quero Retirar Alimentos
            </Link>
            <Link
              data-testid="landing-hero-parceiro-button"
              href="#parceiros"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/70 px-5 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors duration-200"
            >
              Quero ser Parceiro
            </Link>
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
          colors: tons quentes alinhados com brand green/white
          avoid: Imagens tristes, fome aparente, drama excessivo
          */}
          <Image
            src="/images/hero-landing.png"
            alt="Ilustração de pessoas recebendo alimentos"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}
