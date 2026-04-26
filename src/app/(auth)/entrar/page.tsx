export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { UtensilsCrossed, Heart, ChefHat, Building2, Gift } from "lucide-react"
import { ROUTES } from "@/lib/constants"
import { getServerSession, getLoginRedirect } from "@/lib/auth/session"

export const metadata = { title: "Entrar — Prato Solidário" }

const paths = [
  {
    href: ROUTES.RETIRAR,
    icon: <UtensilsCrossed className="h-6 w-6" />,
    title: "Quero Receber",
    description: "Solicite refeições disponíveis perto de você",
    color: "bg-[var(--color-primary-raw)]/10 text-[var(--color-primary-raw)] hover:bg-[var(--color-primary-raw)]/20 border-[var(--color-primary-raw)]/20",
  },
  {
    href: ROUTES.CADASTRO_DOADOR,
    icon: <Heart className="h-6 w-6" />,
    title: "Quero Doar",
    description: "Compartilhe o que sobrou e faça a diferença",
    color: "bg-[var(--color-secondary-raw)]/10 text-[var(--color-secondary-raw)] hover:bg-[var(--color-secondary-raw)]/20 border-[var(--color-secondary-raw)]/20",
  },
  {
    href: ROUTES.CADASTRO_MARMITARIA,
    icon: <ChefHat className="h-6 w-6" />,
    title: "Sou Marmitaria",
    description: "Receba patrocínios e entregue marmitas solidárias",
    color: "bg-[var(--color-accent-raw)]/20 text-[var(--color-on-accent)] hover:bg-[var(--color-accent-raw)]/30 border-[var(--color-accent-raw)]/30",
  },
  {
    href: ROUTES.CADASTRO_ONG,
    icon: <Building2 className="h-6 w-6" />,
    title: "Sou ONG",
    description: "Cadastre sua organização e amplie o impacto",
    color: "bg-[var(--color-info)]/10 text-[var(--color-info)] hover:bg-[var(--color-info)]/20 border-[var(--color-info)]/20",
  },
  {
    href: ROUTES.PATROCINAR,
    icon: <Gift className="h-6 w-6" />,
    title: "Quero Patrocinar",
    description: "Financie marmitas solidárias para quem precisa",
    color: "bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 border-[var(--color-success)]/20",
  },
]

export default async function EntrarPage() {
  const session = await getServerSession()
  if (session) {
    redirect(getLoginRedirect(session.role as string))
  }

  return (
    <div className="min-h-screen bg-[var(--color-primary-raw)]/5 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {/* @ASSET_PLACEHOLDER
          name: logo-prato-solidario
          type: image
          extension: png
          dimensions: 180x40
          description: Logo Prato Solidário para página de entrada
          */}
          <Image
            src="/images/logo-prato-solidario.png"
            alt="Prato Solidário"
            width={180}
            height={40}
            className="mx-auto h-12 w-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Como você quer participar?
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Escolha seu papel na corrente do bem
          </p>
        </div>

        <div data-testid="entrar-role-list" className="space-y-3">
          {paths.map((path) => {
            const slug = path.href.split("/").filter(Boolean).pop() ?? "home"
            return (
            <Link
              key={path.href}
              href={path.href}
              data-testid={`entrar-role-option-${slug}`}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${path.color}`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/50">
                {path.icon}
              </div>
              <div>
                <p className="font-semibold">{path.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{path.description}</p>
              </div>
            </Link>
            )
          })}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Já tem conta?{" "}
          <Link
            data-testid="entrar-login-link"
            href={ROUTES.LOGIN}
            className="font-medium text-[var(--color-primary-raw)] hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
