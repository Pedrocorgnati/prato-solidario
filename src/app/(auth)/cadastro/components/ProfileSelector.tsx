"use client"

import Link from "next/link"
import { Heart, UtensilsCrossed, Building2, ChefHat, HandCoins, Package } from "lucide-react"
import { ROUTES } from "@/lib/constants"

interface ProfileCard {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  badge?: string
}

const profiles: ProfileCard[] = [
  {
    icon: <Heart className="h-7 w-7" />,
    title: "Doador Pessoa Física",
    description: "Doe refeições ou alimentos diretamente para quem precisa",
    href: ROUTES.CADASTRO_DOADOR,
  },
  {
    icon: <UtensilsCrossed className="h-7 w-7" />,
    title: "Doador Restaurante",
    description: "Cadastre seu estabelecimento e doe o excedente do dia",
    href: ROUTES.CADASTRO_RESTAURANTE,
  },
  {
    icon: <Building2 className="h-7 w-7" />,
    title: "ONG / Redistribuidor",
    description: "Receba doações e distribua para comunidades vulneráveis",
    href: ROUTES.CADASTRO_ONG,
  },
  {
    icon: <ChefHat className="h-7 w-7" />,
    title: "Marmitaria Parceira",
    description: "Venda marmitas subsidiadas com apoio de patrocinadores",
    href: ROUTES.CADASTRO_MARMITARIA,
  },
  {
    icon: <HandCoins className="h-7 w-7" />,
    title: "Patrocinador",
    description: "Financie marmitas e apoie o combate à fome com sua marca",
    href: ROUTES.CADASTRO_PATROCINADOR,
  },
  {
    icon: <Package className="h-7 w-7" />,
    title: "Receptor",
    description: "Acesse refeições gratuitas ou subsidiadas perto de você",
    href: ROUTES.CADASTRO_RECEPTOR,
    badge: "Opcional",
  },
]

export function ProfileSelector() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <Link
          key={profile.href}
          href={profile.href}
          className="relative flex flex-col gap-3 rounded-xl border p-5 transition-shadow hover:shadow-md cursor-pointer"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "color-mix(in srgb, var(--color-border-raw) 100%, transparent)",
          }}
        >
          {profile.badge && (
            <span className="absolute right-3 top-3 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {profile.badge}
            </span>
          )}

          <span
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ color: "var(--color-primary-raw)", backgroundColor: "color-mix(in srgb, var(--color-primary-raw) 10%, transparent)" }}
          >
            {profile.icon}
          </span>

          <div className="space-y-1">
            <p
              className="text-sm font-semibold leading-snug"
              style={{ color: "var(--color-text-primary)" }}
            >
              {profile.title}
            </p>
            <p
              className="text-xs leading-snug"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {profile.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
