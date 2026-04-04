"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthLayout } from "@/components/shared/auth-layout"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { signIn } from "@/actions/auth"
import { ROUTES, UserRole } from "@/lib/constants"
import { useRouter, useSearchParams } from "next/navigation"

// RESOLVED: redirect pós-login sem role-awareness — mapa role → rota home
const ROLE_HOME: Record<string, string> = {
  [UserRole.ADMIN]:       ROUTES.ADMIN,
  [UserRole.DOADOR]:      ROUTES.DOADOR,
  [UserRole.ONG]:         ROUTES.DOADOR,
  [UserRole.MARMITARIA]:  ROUTES.MARMITARIA,
  [UserRole.RECEPTOR]:    ROUTES.RETIRAR,
  [UserRole.PATROCINADOR]:ROUTES.PATROCINAR,
  [UserRole.VOLUNTARIO]:  ROUTES.ENTRAR,
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = React.useState(false)
  const [state, setState] = React.useState<"idle" | "loading" | "error" | "unverified">("idle")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setState("loading")
    try {
      const result = await signIn(data)
      if (result.error) {
        setState("error")
      } else {
        toast.success("Bem-vindo(a) de volta!")
        // RESOLVED: redirect pós-login com role-awareness
        // Se vier redirectTo na query string, usa ele; caso contrário vai para a área do role
        const redirectTo = searchParams.get("redirectTo")
        const roleHome = result.data?.role ? (ROLE_HOME[result.data.role] ?? ROUTES.ENTRAR) : ROUTES.ENTRAR
        router.push(redirectTo ?? roleHome)
      }
    } catch {
      setState("error")
    }
  }

  return (
    <AuthLayout
      title="Entrar na conta"
      subtitle="Transforme seu excedente em solidariedade"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {state === "error" && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 p-3 text-sm text-[var(--color-danger)]"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>E-mail ou senha incorretos. Verifique e tente novamente.</span>
          </div>
        )}
        {state === "unverified" && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 p-3 text-sm text-[var(--color-warning)]"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Verifique seu e-mail antes de entrar.{" "}
              <button className="underline font-medium" type="button">Reenviar</button>
            </span>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            {...register("email")}
            aria-invalid={!!errors.email}
            className={errors.email ? "border-[var(--color-danger)]" : ""}
          />
          {errors.email && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href={ROUTES.RECUPERAR_SENHA}
              className="text-xs text-[var(--color-primary-raw)] hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              className={`pr-10 ${errors.password ? "border-[var(--color-danger)]" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="rememberMe" {...register("rememberMe")} />
          <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
            Lembrar-me
          </Label>
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={state === "loading"}
        >
          {state === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
        Não tem conta?{" "}
        <Link
          href={ROUTES.ENTRAR}
          className="font-medium text-[var(--color-primary-raw)] hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
