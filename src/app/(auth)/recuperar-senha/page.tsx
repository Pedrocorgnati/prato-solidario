"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/components/shared/auth-layout"
import { resetPassword } from "@/actions/auth"
import { ROUTES } from "@/lib/constants"

const schema = z.object({ email: z.string().email("E-mail inválido") })

export default function RecuperarSenhaPage() {
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email }: { email: string }) {
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch {
      toast.error("Erro ao enviar e-mail. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="E-mail enviado!">
        <div className="text-center space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Verifique sua caixa de entrada para redefinir sua senha.
          </p>
          <Link href={ROUTES.LOGIN} className="text-sm font-medium text-[var(--color-primary-raw)] hover:underline">
            Voltar ao login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber o link de redefinição"
    >
      <form data-testid="form-recuperar-senha" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input
            data-testid="form-recuperar-senha-email-input"
            id="email"
            type="email"
            placeholder="seu@email.com"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>
          )}
        </div>
        <Button data-testid="form-recuperar-senha-submit-button" type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Enviar link"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href={ROUTES.LOGIN} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          Voltar ao login
        </Link>
      </p>
    </AuthLayout>
  )
}
