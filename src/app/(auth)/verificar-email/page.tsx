"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { EmptyState } from "@/components/ui/empty-state"
import { AuthLayout } from "@/components/shared/auth-layout"
import { resendVerificationAction } from "./actions"
import { toast } from "sonner"
import { ROUTES } from "@/lib/constants"
import { RESEND_VERIFICATION_COOLDOWN_S } from "@/lib/auth/recovery-types"

/**
 * Mensagens de erro mapeadas do ERROR-CATALOG para exibição amigável.
 * AUTH_003 = conta não verificada; AUTH_006 = rate limit / token expirado.
 */
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_003: "Sua conta ainda não foi verificada. Verifique seu e-mail.",
  AUTH_006: "Muitas tentativas. Tente novamente em alguns minutos.",
}

export default function VerificarEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") ?? ""
  const errorParam = searchParams.get("error")

  const [loading, setLoading] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)

  // Countdown timer for cooldown
  React.useEffect(() => {
    if (cooldown <= 0) return
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown])

  // EmptyState when email is missing
  if (!email) {
    return (
      <AuthLayout title="Verificar e-mail">
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="Sessão inválida"
          description="Faça login novamente."
          action={{
            label: "Ir para o login",
            onClick: () => router.push(ROUTES.LOGIN),
          }}
        />
      </AuthLayout>
    )
  }

  async function handleResend() {
    setLoading(true)
    try {
      const result = await resendVerificationAction(email)
      if (result.success) {
        toast.success("E-mail reenviado! Verifique também a pasta de spam.")
        setCooldown(RESEND_VERIFICATION_COOLDOWN_S)
      } else if (result.error === "AUTH_006" && result.retryAfter) {
        setCooldown(result.retryAfter)
        toast.error(`Muitas tentativas. Aguarde ${result.retryAfter}s.`)
      } else if (result.error === "VAL_001") {
        toast.error("E-mail inválido.")
      } else {
        toast.error("Erro ao reenviar. Tente novamente.")
      }
    } catch {
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = loading || cooldown > 0

  return (
    <AuthLayout title="Verifique seu e-mail">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Error banner from searchParams */}
        {errorParam && ERROR_MESSAGES[errorParam] && (
          <Alert
            data-testid="verificar-email-error-banner"
            className="w-full border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{ERROR_MESSAGES[errorParam]}</span>
          </Alert>
        )}

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-raw)]/10">
          <Mail className="h-8 w-8 text-[var(--color-primary-raw)]" />
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">
          Enviamos um link de verificação para{" "}
          <strong className="text-[var(--color-text-primary)]">{email}</strong>.{" "}
          Clique no link para ativar sua conta.
        </p>

        <p className="text-xs text-[var(--color-text-muted)]">
          Não encontrou? Verifique a pasta de spam ou lixo eletrônico.
        </p>

        <Button
          data-testid="verificar-email-resend-button"
          variant="outline"
          size="md"
          onClick={handleResend}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reenviando...
            </>
          ) : cooldown > 0 ? (
            <span aria-live="polite">Reenviar em {cooldown}s</span>
          ) : (
            "Reenviar e-mail de verificação"
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
