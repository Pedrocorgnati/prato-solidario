export const dynamic = 'force-dynamic'
import { listPartnersAdmin } from '@/actions/admin-list.actions'
import { AdminParceirosClient } from './AdminParceirosClient'

export const metadata = { title: 'Parceiros — Admin' }

export default async function AdminParceirosPage() {
  const res = await listPartnersAdmin({ limit: 100 })

  return <AdminParceirosClient initialData={res.data ?? []} total={res.total ?? 0} />
}
