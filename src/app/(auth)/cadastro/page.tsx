export const dynamic = 'force-dynamic'
import type { Metadata } from "next"
import Link from "next/link"
import { ProfileSelector } from "./components/ProfileSelector"
import { ROUTES } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Criar conta — Prato Solidário",
  description: "Escolha como você quer participar do Prato Solidário",
}

export default function CadastroPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Como você quer participar?
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Escolha o perfil que melhor descreve você
        </p>
      </div>

      <ProfileSelector />

      <p className="mt-8 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Já tenho conta?{" "}
        <Link
          href={ROUTES.ENTRAR}
          className="font-medium underline-offset-4 hover:underline"
          style={{ color: "var(--color-primary-raw)" }}
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}
