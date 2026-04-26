export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation"
import { getMarmitariaPublicById } from "@/actions/sponsors"
import { MarmitariaDetail } from "./marmitaria-detail"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ marmitariaId: string }>
}) {
  const { marmitariaId } = await params
  const { data } = await getMarmitariaPublicById(marmitariaId)
  if (!data) return { title: "Marmitaria não encontrada — Prato Solidário" }
  return { title: `Patrocinar ${data.name} — Prato Solidário` }
}

// ---------------------------------------------------------------------------
// Page (RSC — fetches data, delegates to client component)
// ---------------------------------------------------------------------------

export default async function MarmitariaDetailPage({
  params,
}: {
  params: Promise<{ marmitariaId: string }>
}) {
  const { marmitariaId } = await params
  const { data } = await getMarmitariaPublicById(marmitariaId)

  if (!data) {
    notFound()
  }

  return (
    <MarmitariaDetail
      data={{
        id: data.id,
        name: data.name,
        description: data.description,
        photo: data.photo,
        neighborhood: data.neighborhood,
        city: data.city,
        address: data.address,
        pricePerMeal: data.pricePerMeal,
        availableCredits: data.availableCredits,
        schedule: data.schedule,
      }}
    />
  )
}
