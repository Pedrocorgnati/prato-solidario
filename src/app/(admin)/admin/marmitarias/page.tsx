export const dynamic = 'force-dynamic'
import { listMarmitariasAdmin } from '@/actions/admin-list.actions'
import { AdminMarmitariasClient } from './AdminMarmitariasClient'

export const metadata = { title: 'Marmitarias — Admin' }

export default async function AdminMarmitariasPage() {
  const res = await listMarmitariasAdmin({ limit: 100 })
  const pendingCount = (res.data ?? []).filter(
    (m: { status: string }) => m.status === 'PENDING_APPROVAL'
  ).length

  return (
    <AdminMarmitariasClient
      initialData={res.data ?? []}
      total={res.total ?? 0}
      pendingCount={pendingCount}
    />
  )
}
