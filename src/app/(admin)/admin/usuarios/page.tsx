export const dynamic = 'force-dynamic'
import { listUsersAdmin } from '@/actions/admin-list.actions'
import { AdminUsuariosClient } from './AdminUsuariosClient'

export const metadata = { title: 'Usuários — Admin' }

export default async function AdminUsuariosPage() {
  const [donorsRes, receptorsRes] = await Promise.all([
    listUsersAdmin({ role: 'DONOR', limit: 50 }),
    listUsersAdmin({ role: 'RECIPIENT', limit: 50 }),
  ])

  return (
    <AdminUsuariosClient
      initialDonors={donorsRes.data}
      initialReceptors={receptorsRes.data}
      totalDonors={donorsRes.total}
      totalReceptors={receptorsRes.total}
    />
  )
}
