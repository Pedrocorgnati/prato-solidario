"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound, Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { AuthLayout } from "@/components/shared/auth-layout"
import { resetPasswordAction } from "./actions"
import { resetPasswordSchema } from "@/lib/auth/recovery-types"
import type { ResetPasswordFormData } from "@/lib/auth/recovery-types"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { ROUTES } from "@/lib/constants"

type SessionState = "checking" | "valid" | "expired"

function getPasswordStrength(password: string): "weak" | "medium" | "strong" {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const score = [hasMinLength, hasUppercase, hasNumber].filter(Boolean).length
  if (score === 3) return "strong"
  if (score >= 1 && hasMinLength) return "medium"
  return "weak"
}

const STRENGTH_CONFIG = {
  weak: { label: "Fraca", color: "bg-[var(--color-danger)]", width: "w-1/3" },
  medium: { label: "Média", color: "bg-yellow-500", width: "w-2/3" },
  strong: { label: "Forte", color: "bg-green-500", width: "w-full" },
}

export default function NovaSenhaPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const errorParam = searchParams.get("error")

  const [sessionState, setSessionState] = React.useState<SessionState>("checking")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const password = watch("password", "")
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const strength = getPasswordStrength(password)
  const strengthConfig = STRENGTH_CONFIG[strength]

  // Check session on mount
  React.useEffect(() => {
    if (errorParam === "AUTH_007") {
      setSessionState("expired")
      return
    }

    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionState(session ? "valid" : "expired")
    })
  }, [errorParam])

  async function onSubmit(data: ResetPasswordFormData) {
    try {
      const result = await resetPasswordAction(data.password, data.confirmPassword)
      if (result.success) {
        toast.success("Senha alterada com sucesso!")
        router.push(ROUTES.LOGIN)
      } else if (result.error === "AUTH_001") {
        setSessionState("expired")
      } else if (result.error === "VAL_003") {
        toast.error("Senha não atende aos requisitos mínimos.")
      } else {
        toast.error("Erro ao redefinir senha. Tente novamente.")
      }
    } catch {
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.")
    }
  }

  // Loading initial (checking session)
  if (sessionState === "checking") {
    return (
      <AuthLayout title="Nova senha">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-muted)]" />
        </div>
      </AuthLayout>
    )
  }

  // Expired / invalid token
  if (sessionState === "expired") {
    return (
      <AuthLayout title="Link expirado">
        <div className="flex flex-col items-center gap-4 text-center">
          <Alert className="w-full border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Este link de recuperação expirou. Por segurança, os links são
              válidos por apenas 1 hora.
            </span>
          </Alert>
          <Button
            data-testid="nova-senha-request-new-link"
            variant="default"
            size="lg"
            className="w-full"
            onClick={() => router.push(ROUTES.RECUPERAR_SENHA)}
          >
            Solicitar novo link
          </Button>
        </div>
      </AuthLayout>
    )
  }

  // Valid session — show form
  return (
    <AuthLayout
      title="Criar nova senha"
      subtitle="Escolha uma senha segura para sua conta."
    >
      <form
        data-testid="form-nova-senha"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Password field */}
        <div className="space-y-1">
          <Label htmlFor="password">Nova senha</Label>
          <div className="relative">
            <Input
              data-testid="form-nova-senha-password-input"
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Nova senha"
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby="password-strength password-requirements"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Password strength indicator */}
        {password.length > 0 && (
          <div id="password-strength" className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-[var(--color-muted-raw)]">
              <div
                className={`h-full rounded-full transition-all ${strengthConfig.color} ${strengthConfig.width}`}
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Força: {strengthConfig.label}
            </p>
          </div>
        )}

        {/* Password requirements checklist */}
        <ul
          id="password-requirements"
          aria-live="polite"
          className="space-y-0.5 text-xs"
        >
          <li
            className={
              hasMinLength
                ? "text-green-600"
                : "text-[var(--color-text-muted)]"
            }
          >
            {hasMinLength ? "✓" : "✗"} Mínimo de 8 caracteres
          </li>
          <li
            className={
              hasUppercase
                ? "text-green-600"
                : "text-[var(--color-text-muted)]"
            }
          >
            {hasUppercase ? "✓" : "✗"} Ao menos 1 letra maiúscula
          </li>
          <li
            className={
              hasNumber ? "text-green-600" : "text-[var(--color-text-muted)]"
            }
          >
            {hasNumber ? "✓" : "✗"} Ao menos 1 número
          </li>
        </ul>

        {/* Confirm password field */}
        <div className="space-y-1">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <div className="relative">
            <Input
              data-testid="form-nova-senha-confirm-input"
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirmar nova senha"
              {...register("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          data-testid="form-nova-senha-submit-button"
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            "Salvar nova senha"
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}
