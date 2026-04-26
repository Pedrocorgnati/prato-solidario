import type { Metadata } from "next"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { HeroSection } from "@/components/landing/HeroSection"
import { ImpactCounter } from "@/components/landing/ImpactCounter"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { TestimonialsSection } from "@/components/landing/TestimonialsSection"
import { PartnersSection } from "@/components/landing/PartnersSection"
import { CTASection } from "@/components/landing/CTASection"
import { BannerDisplay } from "@/components/banners/BannerDisplay"
import { ApkDownloadSection } from "@/components/landing/ApkDownloadSection"
import { HallOfFamePreview } from "@/components/landing/HallOfFamePreview"

// DemandHeatmap usa Mapbox GL (browser-only) — importar com ssr:false
const DemandHeatmap = dynamic(
  () => import("@/components/map/DemandHeatmap").then((m) => ({ default: m.DemandHeatmap })),
  { ssr: false },
)

// Server Component — sem 'use client'

export const metadata: Metadata = {
  title: "Prato Solidário — Conectando quem tem com quem precisa",
  description:
    "Plataforma digital de doação de alimentos. Doe refeições, encontre doações próximas de você, apoie quem precisa. Banco de alimentos digital e gratuito.",
  keywords: [
    "doação de alimentos",
    "refeições gratuitas",
    "banco de alimentos digital",
    "prato solidário",
    "doação refeições",
  ],
  openGraph: {
    title: "Prato Solidário",
    description: "Conectando doadores e receptores de alimentos em todo o Brasil",
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Prato Solidário",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/og-image`,
        width: 1200,
        height: 630,
        alt: "Prato Solidário — Doação de Alimentos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prato Solidário",
    description: "Plataforma digital de doação de alimentos",
    images: [`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/og-image`],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LandingPage() {
  return (
    <>
      {/* Banner TOP — posição premium, logo abaixo do PublicNavbar (no layout) */}
      <Suspense fallback={null}>
        <BannerDisplay position="TOP" />
      </Suspense>

      <HeroSection />

      <Suspense
        fallback={
          <div className="py-12 bg-[var(--color-background-raw)]">
            <div className="mx-auto max-w-6xl px-4 grid grid-cols-2 gap-8 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-12 w-28 animate-pulse rounded bg-green-200" />
                  <div className="h-4 w-36 animate-pulse rounded bg-green-100" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <ImpactCounter />
      </Suspense>

      <HowItWorks />

      {/* Banner INLINE — entre HowItWorks e Testimonials (zona de atenção alta) */}
      <Suspense fallback={null}>
        <BannerDisplay position="INLINE" />
      </Suspense>

      <TestimonialsSection />

      {/* Hall da Fama — top 3 doadores do mês */}
      <Suspense fallback={null}>
        <HallOfFamePreview />
      </Suspense>

      <PartnersSection />

      {/* Mapa de calor embarcado — carregado no cliente, abaixo do fold */}
      <section
        data-testid="landing-heatmap-section"
        className="py-12 bg-[var(--color-surface)]"
        aria-label="Mapa de demanda por refeições"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 text-center">
            Onde há mais demanda agora
          </h2>
          <div className="h-[400px] rounded-xl overflow-hidden">
            <DemandHeatmap />
          </div>
        </div>
      </section>

      {/* CTA download APK — condicional a NEXT_PUBLIC_APK_URL */}
      <ApkDownloadSection />

      <CTASection />
    </>
  )
}
