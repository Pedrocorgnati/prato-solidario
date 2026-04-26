export const dynamic = 'force-dynamic'
import { listIncidentsAdmin } from '@/actions/admin-list.actions'
import { AdminIncidentesClient } from './AdminIncidentesClient'

export const metadata = { title: 'Incidentes — Admin' }

export default async function AdminIncidentesPage() {
  const res = await listIncidentsAdmin({ limit: 100 })

  return (
    <AdminIncidentesClient
      initialData={res.data ?? []}
      total={res.total ?? 0}
      openCount={res.openCount ?? 0}
    />
  )
}
