export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { getIncidentDetail } from '@/actions/admin-list.actions'
import { IncidenteDetailClient } from './IncidenteDetailClient'

export const metadata = { title: 'Detalhes do Incidente — Admin' }

export default async function IncidenteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const incident = await getIncidentDetail(id)

  if (!incident) {
    notFound()
  }

  return <IncidenteDetailClient incident={incident} />
}
