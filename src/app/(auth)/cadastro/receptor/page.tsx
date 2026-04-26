"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Info } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthLayout } from "@/components/shared/auth-layout"
import { CepInput } from "@/components/shared/cep-input"
import { registerReceptorAction } from "./actions"
import { registerReceptorSchema } from "@/types/register.types"
import { stripMask } from "@/utils/formatters"
import { ROUTES } from "@/lib/constants"

// Extend schema with confirmPassword + termos (client-only fields)
const formSchema = registerReceptorSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
    termos: z.literal(true, {
      error: "Você deve aceitar os Termos de Uso para continuar",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof formSchema>

export default function CadastroReceptorPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cep: "",
    },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        cep: data.cep ? stripMask(data.cep) : undefined,
      }

      const result = await registerReceptorAction(payload)

      if (!result.success) {
        toast.error(result.error ?? "Erro ao criar conta.")
        return
      }

      router.push(`${ROUTES.VERIFICAR_EMAIL}?email=${encodeURIComponent(data.email)}`)
    } catch {
      toast.error("Erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Quero receber refeições" subtitle="Cadastro rápido — 1 etapa">
      {/* Banner: cadastro opcional */}
      <div
        className="mb-2 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
        role="note"
        aria-label="Informação sobre cadastro opcional"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          O cadastro é opcional — você pode retirar alimentos apresentando apenas um código.
        </span>
      </div>

      {/* Link: retirar sem conta */}
      <div className="mb-4 text-center text-sm">
        <Link
          href={ROUTES.RETIRAR}
          className="text-[var(--color-primary-raw)] hover:underline"
        >
          Retirar sem criar conta →
        </Link>
      </div>

      <form
        data-testid="form-cadastro-receptor"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Nome */}
        <div className="space-y-1">
          <Label htmlFor="name">
            Nome completo <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            data-testid="form-cadastro-receptor-name-input"
            id="name"
            {...register("name")}
            placeholder="Seu nome"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* E-mail */}
        <div className="space-y-1">
          <Label htmlFor="email">
            E-mail <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            data-testid="form-cadastro-receptor-email-input"
            id="email"
            type="email"
            {...register("email")}
            placeholder="seu@email.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-1">
          <Label htmlFor="password">
            Senha <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            data-testid="form-cadastro-receptor-password-input"
            id="password"
            type="password"
            {...register("password")}
            placeholder="Mínimo 8 caracteres"
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirmar senha */}
        <div className="space-y-1">
          <Label htmlFor="confirmPassword">
            Confirmar senha <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            placeholder="Repita a senha"
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* CEP (opcional) */}
        <Controller
          name="cep"
          control={control}
          render={({ field }) => (
            <CepInput
              label="CEP (opcional)"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.cep?.message}
              name="cep"
            />
          )}
        />
        <p className="mt-0 text-xs text-[var(--color-text-muted)]">
          Para receber alertas de doações próximas
        </p>

        {/* Termos de uso */}
        <div className="flex items-start gap-2">
          <Controller
            name="termos"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="termos"
                checked={field.value === true}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true ? true : undefined)
                }}
                aria-invalid={!!errors.termos}
              />
            )}
          />
          <Label
            htmlFor="termos"
            className="cursor-pointer text-sm leading-snug text-[var(--color-text-secondary)]"
          >
            Li e aceito os{" "}
            <Link
              href={ROUTES.TERMOS}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary-raw)] hover:underline"
            >
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link
              href={ROUTES.PRIVACIDADE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary-raw)] hover:underline"
            >
              Política de Privacidade
            </Link>
          </Label>
        </div>
        {errors.termos && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            {errors.termos.message as string}
          </p>
        )}

        <Button
          data-testid="form-cadastro-receptor-submit-button"
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
        Já tem conta?{" "}
        <Link
          href={ROUTES.ENTRAR}
          className="text-[var(--color-primary-raw)] hover:underline"
        >
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
