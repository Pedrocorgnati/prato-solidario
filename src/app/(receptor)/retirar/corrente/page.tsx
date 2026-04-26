export const dynamic = 'force-dynamic'
import * as React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { CorrenteBemCard } from "@/components/corrente/CorrenteBemCard"
import { ShareButton } from "@/components/corrente/ShareButton"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart } from "lucide-react"

export const metadata: Metadata = {
  title: "Corrente do Bem | Prato Solidário",
  description: "Você fez parte da Corrente do Bem!",
}

interface ImpactData {
  refeicoesHoje: number
  refeicoesEsteMes: number
  refeicoesTotais: number
}

interface ImpactResult {
  data: ImpactData
  hasError: boolean
}

async function getImpactPreview(): Promise<ImpactResult> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    const res = await fetch(`${baseUrl}/api/v1/impact/preview`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) throw new Error("impact preview not ok")

    const data = (await res.json()) as ImpactData
    return { data, hasError: false }
  } catch {
    return {
      data: { refeicoesHoje: 0, refeicoesEsteMes: 0, refeicoesTotais: 0 },
      hasError: true,
    }
  }
}

export default async function CorrenteBemPage() {
  const { data: impact, hasError } = await getImpactPreview()

  const shareUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? "https://pratosolidario.com.br") +
    "/retirar/corrente"

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 pt-8 pb-16">
      {/* Card de impacto */}
      <CorrenteBemCard
        refeicoesHoje={impact.refeicoesHoje}
        refeicoesEsteMes={impact.refeicoesEsteMes}
        refeicoesTotais={impact.refeicoesTotais}
        hasError={hasError}
        shareButtonSlot={
          <ShareButton
            refeicoesHoje={impact.refeicoesHoje}
            shareUrl={shareUrl}
          />
        }
      />

      {/* Mensagem de agradecimento */}
      <div className="mt-6 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <Heart className="h-4 w-4 text-red-400" aria-hidden="true" />
        <span>Obrigado por fazer parte dessa corrente!</span>
      </div>

      {/* Navegação */}
      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-md">
        <Link href="/retirar" className="w-full">
          <Button
            variant="default"
            className="w-full min-h-[44px]"
            data-testid="btn-ver-mais-doacoes"
          >
            Ver mais doações disponíveis
          </Button>
        </Link>

        <Link href="/" className="w-full">
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            data-testid="btn-voltar-inicio"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Voltar ao início
          </Button>
        </Link>
      </div>
    </main>
  )
}
