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
import { DocumentInput } from "@/components/shared/document-input"
import { registerPatrocinadorAction } from "./actions"
import { registerPatrocinadorSchema } from "@/types/register.types"
import { stripMask } from "@/utils/formatters"
import { ROUTES } from "@/lib/constants"

// Extend schema with confirmPassword + termos (client-only fields)
const formSchema = registerPatrocinadorSchema
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
  .refine(
    (data) =>
      data.sponsorType === "PF" ? !!data.cpf : !!data.cnpj,
    {
      message: "Documento é obrigatório",
      path: ["cpf"],
    }
  )

type FormData = z.infer<typeof formSchema>

export default function CadastroPatrocinadorPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sponsorType: "PF",
      cpf: "",
      cnpj: "",
    },
  })

  const sponsorType = watch("sponsorType")
  const termos = watch("termos")

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const payload = {
        name: data.name,
        sponsorType: data.sponsorType,
        email: data.email,
        password: data.password,
        cpf: data.sponsorType === "PF" && data.cpf ? stripMask(data.cpf) : undefined,
        cnpj: data.sponsorType === "EMPRESA" && data.cnpj ? stripMask(data.cnpj) : undefined,
      }

      const result = await registerPatrocinadorAction(payload)

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
    <AuthLayout title="Quero patrocinar" subtitle="Cadastro rápido — 1 etapa">
      {/* Info: patrocínio sem conta */}
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-muted-raw)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-raw)]" aria-hidden="true" />
        <span>
          Você também pode patrocinar marmitas sem criar conta.{" "}
          <Link href={ROUTES.PATROCINAR} className="text-[var(--color-primary-raw)] hover:underline">
            Patrocinar agora
          </Link>
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nome */}
        <div className="space-y-1">
          <Label htmlFor="name">
            Nome ou razão social <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Seu nome completo ou razão social"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Tipo de patrocinador: PF / Empresa */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--color-text-primary)]">
            Tipo de patrocinador <span className="text-[var(--color-danger)]">*</span>
          </legend>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                value="PF"
                {...register("sponsorType")}
                className="accent-[var(--color-primary-raw)]"
              />
              Pessoa Física
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                value="EMPRESA"
                {...register("sponsorType")}
                className="accent-[var(--color-primary-raw)]"
              />
              Empresa
            </label>
          </div>
          {errors.sponsorType && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.sponsorType.message}
            </p>
          )}
        </fieldset>

        {/* CPF (Pessoa Física) */}
        {sponsorType === "PF" && (
          <Controller
            name="cpf"
            control={control}
            render={({ field }) => (
              <DocumentInput
                type="cpf"
                label="CPF"
                required
                value={field.value ?? ""}
                onChange={field.onChange}
                error={errors.cpf?.message}
              />
            )}
          />
        )}

        {/* CNPJ (Empresa) */}
        {sponsorType === "EMPRESA" && (
          <Controller
            name="cnpj"
            control={control}
            render={({ field }) => (
              <DocumentInput
                type="cnpj"
                label="CNPJ"
                required
                value={field.value ?? ""}
                onChange={field.onChange}
                error={errors.cnpj?.message}
              />
            )}
          />
        )}

        {/* E-mail */}
        <div className="space-y-1">
          <Label htmlFor="email">
            E-mail <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
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
