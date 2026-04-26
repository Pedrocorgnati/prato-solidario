export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { MarmitariaDetailClient } from './MarmitariaDetailClient'

export const metadata = { title: 'Detalhes da Marmitaria — Admin' }

async function getMarmitaria(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/v1/admin/marmitarias/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function MarmitariaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const marmitaria = await getMarmitaria(id)

  if (!marmitaria) {
    notFound()
  }

  return <MarmitariaDetailClient marmitaria={marmitaria} />
}
