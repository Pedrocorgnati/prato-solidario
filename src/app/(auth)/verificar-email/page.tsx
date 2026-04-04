"use client"

import * as React from "react"
import Link from "next/link"
import { Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthLayout } from "@/components/shared/auth-layout"
import { resendVerification } from "@/actions/auth"
import { toast } from "sonner"
import { ROUTES } from "@/lib/constants"
import { useSearchParams } from "next/navigation"

export default function VerificarEmailPage() {
  const searchParams = useSearchParams()
  // RESOLVED: email hardcoded — lê o email da query string passada pelo fluxo de cadastro
  const email = searchParams.get("email") ?? ""
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  async function handleResend() {
    setLoading(true)
    try {
      await resendVerification(email)
      setSent(true)
      toast.success("E-mail reenviado!")
    } catch {
      toast.error("Erro ao reenviar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Verifique seu e-mail">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-raw)]/10">
          <Mail className="h-8 w-8 text-[var(--color-primary-raw)]" />
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Enviamos um link de verificação para{" "}
          {email ? <strong className="text-[var(--color-text-primary)]">{email}</strong> : "seu e-mail"}.{" "}
          Clique no link para ativar sua conta.
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Não recebeu? Verifique a pasta de spam.
        </p>
        <Button
          variant="outline"
          size="md"
          onClick={handleResend}
          disabled={loading || sent}
          className="w-full"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reenviando...</>
          ) : sent ? (
            "E-mail reenviado!"
          ) : (
            "Reenviar e-mail"
          )}
        </Button>
        <Link
          href={ROUTES.LOGIN}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          Voltar ao login
        </Link>
      </div>
    </AuthLayout>
  )
}
