"use client"

import * as React from "react"
import { Loader2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"

export default function CheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [quantity, setQuantity] = React.useState("5")
  const pricePerMeal = 14.0
  const total = parseInt(quantity || "0") * pricePerMeal

  async function handlePay() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    toast.success("Patrocínio confirmado!")
    router.push(ROUTES.PATROCINAR_CONFIRMACAO)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Checkout</h1>
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-4 space-y-1">
        <p className="text-sm text-[var(--color-text-muted)]">Marmitaria</p>
        <p className="font-semibold text-[var(--color-text-primary)]">Marmitaria da Dona Maria</p>
        <p className="text-sm text-[var(--color-text-secondary)]">R$ {pricePerMeal.toFixed(2).replace(".", ",")} por marmita</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="qty">Quantidade de marmitas</Label>
        <Input
          id="qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          className="h-14 text-lg text-center"
        />
      </div>
      <div className="flex justify-between text-lg font-bold">
        <span>Total</span>
        <span className="text-[var(--color-primary-raw)]">
          R$ {total.toFixed(2).replace(".", ",")}
        </span>
      </div>
      <div className="space-y-1">
        <Label>Forma de pagamento</Label>
        <div className="flex flex-col gap-2 mt-1">
          {["Pix (imediato)", "Cartão de crédito"].map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer rounded-md border border-[var(--color-border-raw)] p-3">
              <input type="radio" name="payment" value={opt} className="h-4 w-4" defaultChecked={opt === "Pix (imediato)"} />
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{opt}</span>
            </label>
          ))}
        </div>
      </div>
      <Button variant="default" size="lg" className="w-full" onClick={handlePay} disabled={loading || !quantity || parseInt(quantity) === 0}>
        {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...</> : <><CreditCard className="mr-2 h-5 w-5" /> Confirmar pagamento</>}
      </Button>
    </div>
  )
}
