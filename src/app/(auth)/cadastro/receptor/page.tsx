"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/components/shared/auth-layout"
import { signUp } from "@/actions/auth"
import { ROUTES } from "@/lib/constants"
import Link from "next/link"

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})

type FormData = z.infer<typeof schema>

export default function CadastroReceptorPage() {
  const [loading, setLoading] = React.useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await signUp({ ...data, role: "RECEPTOR" })
      toast.success("Conta criada! Verifique seu e-mail.")
    } catch {
      toast.error("Erro ao criar conta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Quero receber refeições" subtitle="Cadastro rápido — 1 etapa">
      <form data-testid="form-cadastro-receptor" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">Nome completo</Label>
          <Input data-testid="form-cadastro-receptor-name-input" id="name" {...register("name")} placeholder="Seu nome" aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input data-testid="form-cadastro-receptor-email-input" id="email" type="email" {...register("email")} placeholder="seu@email.com" aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Senha</Label>
          <Input data-testid="form-cadastro-receptor-password-input" id="password" type="password" {...register("password")} placeholder="Mínimo 8 caracteres" aria-invalid={!!errors.password} />
          {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
        </div>
        <Button data-testid="form-cadastro-receptor-submit-button" type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</> : "Criar conta"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
        Já tem conta? <Link href={ROUTES.LOGIN} className="text-[var(--color-primary-raw)] hover:underline">Entrar</Link>
      </p>
    </AuthLayout>
  )
}
