export const dynamic = 'force-dynamic'
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getMarmitariaPublicById } from "@/actions/sponsors"
import { getServerSession } from "@/lib/auth/session"
import { CheckoutForm } from "./CheckoutForm"

export const metadata: Metadata = {
  title: "Checkout — Prato Solidário",
}

interface CheckoutPageProps {
  searchParams: Promise<{ marmitariaId?: string; quantity?: string }>
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams
  const marmitariaId = params.marmitariaId
  const quantity = Number(params.quantity)

  if (!marmitariaId || !quantity || quantity < 1 || !Number.isFinite(quantity)) {
    redirect("/patrocinar")
  }

  const { data: marmitaria } = await getMarmitariaPublicById(marmitariaId)

  if (!marmitaria || marmitaria.pricePerMeal == null) {
    redirect("/patrocinar")
  }

  const session = await getServerSession()

  return (
    <CheckoutForm
      marmitaria={{
        id: marmitaria.id,
        name: marmitaria.name,
        pricePerMeal: marmitaria.pricePerMeal,
      }}
      quantity={quantity}
      isAuthenticated={!!session}
      userEmail={session?.email}
    />
  )
}
