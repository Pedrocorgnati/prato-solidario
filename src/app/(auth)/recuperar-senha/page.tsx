"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Lock, Mail, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { AuthLayout } from "@/components/shared/auth-layout"
import { requestPasswordResetAction } from "./actions"
import { recoverPasswordSchema } from "@/lib/auth/recovery-types"
import type { RecoverPasswordFormData } from "@/lib/auth/recovery-types"
import { ROUTES } from "@/lib/constants"

export default function RecuperarSenhaPage() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")

  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoverPasswordFormData>({
    resolver: zodResolver(recoverPasswordSchema),
  })

  async function onSubmit({ email }: RecoverPasswordFormData) {
    setLoading(true)
    try {
      const result = await requestPasswordResetAction(email)
      if (result.success) {
        setSent(true)
      } else if (result.error === "AUTH_006" && result.retryAfter) {
        toast.error(
          `Muitas tentativas. Aguarde ${result.retryAfter} minutos.`
        )
      } else if (result.error === "VAL_001") {
        toast.error("E-mail inválido.")
      } else {
        toast.error("Erro ao enviar e-mail. Tente novamente.")
      }
    } catch {
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // State: sent — ambiguous confirmation (US-023)
  if (sent) {
    return (
      <AuthLayout title="Link enviado!">
        <div
          className="flex flex-col items-center gap-4 text-center"
          aria-live="polite"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-raw)]/10">
            <Mail className="h-6 w-6 text-[var(--color-primary-raw)]" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Se este e-mail estiver cadastrado, você receberá um link de
            redefinição em breve. Verifique também a pasta de spam.
          </p>
          <Link
            href={ROUTES.LOGIN}
            className="text-sm font-medium text-[var(--color-primary-raw)] hover:underline"
          >
            Voltar ao login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // State: idle / submitting
  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe seu e-mail cadastrado para receber um link de redefinição."
    >
      <div className="flex flex-col items-center gap-6">
        {/* Error banner: AUTH_006 rate limit from redirect */}
        {errorParam === "AUTH_006" && (
          <Alert className="w-full border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Muitas tentativas. Aguarde alguns minutos antes de solicitar novamente.</span>
          </Alert>
        )}

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-raw)]/10">
          <Lock className="h-6 w-6 text-[var(--color-primary-raw)]" />
        </div>

        <form
          data-testid="form-recuperar-senha"
          onSubmit={handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input
              data-testid="form-recuperar-senha-email-input"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-[var(--color-danger)]" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
          <Button
            data-testid="form-recuperar-senha-submit-button"
            type="submit"
            variant="default"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              "Enviar link de recuperação"
            )}
          </Button>
        </form>

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
