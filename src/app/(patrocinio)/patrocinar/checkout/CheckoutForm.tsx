"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, CreditCard, Lock, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatRefeicoes } from "@/utils/formatters"

/* ------------------------------------------------------------------ */
/*  Types & Schema                                                     */
/* ------------------------------------------------------------------ */

interface CheckoutFormProps {
  marmitaria: { id: string; name: string; pricePerMeal: number }
  quantity: number
  isAuthenticated: boolean
  userEmail?: string
}

function buildSchema(isAuthenticated: boolean) {
  return z.object({
    guestEmail: isAuthenticated
      ? z.string().optional()
      : z.string().email("Formato de e-mail inválido"),
    paymentMethod: z.enum(["PIX", "CREDIT_CARD"]), // RESOLVED: default removido — defaultValues já define 'PIX', elimina mismatch zodResolver v5
  })
}

// RESOLVED: z.output alinha tipos com zodResolver (paymentMethod sempre string após default)
type FormValues = z.output<ReturnType<typeof buildSchema>>

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CheckoutForm({
  marmitaria,
  quantity,
  isAuthenticated,
  userEmail,
}: CheckoutFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const total = marmitaria.pricePerMeal * quantity

  const schema = buildSchema(isAuthenticated)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      guestEmail: "",
      paymentMethod: "PIX",
    },
  })

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        marmitariaId: marmitaria.id,
        quantity,
        paymentMethod: data.paymentMethod,
      }

      if (data.guestEmail) {
        body.guestEmail = data.guestEmail
      }

      const res = await fetch("/api/v1/sponsors/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message ?? "Erro ao processar pagamento")
      }

      const { initPoint } = await res.json()
      window.location.href = initPoint
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar pagamento")
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Checkout
      </h1>

      {/* ---------- Resumo ---------- */}
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-4 space-y-2">
        <p className="text-sm text-[var(--color-text-muted)]">Marmitaria</p>
        <p className="font-semibold text-[var(--color-text-primary)]">
          {marmitaria.name}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {formatCurrency(marmitaria.pricePerMeal)} por marmita &middot;{" "}
          {formatRefeicoes(quantity)}
        </p>
        <div className="flex justify-between pt-2 border-t border-[var(--color-border-raw)] text-lg font-bold">
          <span className="text-[var(--color-text-primary)]">Total</span>
          <span className="text-[var(--color-primary-raw)]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ---------- Email (apenas guests) ---------- */}
        {!isAuthenticated && (
          <div className="space-y-1">
            <Label htmlFor="guestEmail">Seu e-mail</Label>
            <Input
              id="guestEmail"
              type="email"
              placeholder="voce@exemplo.com"
              {...register("guestEmail")}
              className="h-12"
            />
            {errors.guestEmail && (
              <p className="text-sm text-red-500">{errors.guestEmail.message}</p>
            )}
          </div>
        )}

        {isAuthenticated && userEmail && (
          <p className="text-sm text-[var(--color-text-muted)]">
            Logado como <strong>{userEmail}</strong>
          </p>
        )}

        {/* ---------- Forma de pagamento ---------- */}
        <fieldset className="space-y-1">
          <legend className="flex items-center gap-2 text-sm leading-none font-medium select-none">
            Forma de pagamento
          </legend>
          <div className="flex flex-col gap-2 mt-1">
            <label className="flex items-center gap-3 cursor-pointer rounded-md border border-[var(--color-border-raw)] p-3 has-[:checked]:border-[var(--color-primary-raw)] has-[:checked]:bg-[hsl(var(--color-primary-raw)/0.05)]">
              <input
                type="radio"
                value="PIX"
                {...register("paymentMethod")}
                className="h-4 w-4 accent-[var(--color-primary-raw)]"
              />
              <QrCode className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Pix (imediato)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer rounded-md border border-[var(--color-border-raw)] p-3 has-[:checked]:border-[var(--color-primary-raw)] has-[:checked]:bg-[hsl(var(--color-primary-raw)/0.05)]">
              <input
                type="radio"
                value="CREDIT_CARD"
                {...register("paymentMethod")}
                className="h-4 w-4 accent-[var(--color-primary-raw)]"
              />
              <CreditCard className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Cartão de Crédito
              </span>
            </label>
          </div>
        </fieldset>

        {/* ---------- CTA ---------- */}
        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pagar {formatCurrency(total)} com MercadoPago
            </>
          )}
        </Button>

        {/* ---------- Badge de segurança ---------- */}
        <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <Lock className="h-3 w-3" />
          Pagamento processado com segurança pelo MercadoPago
        </p>
      </form>
    </div>
  )
}
