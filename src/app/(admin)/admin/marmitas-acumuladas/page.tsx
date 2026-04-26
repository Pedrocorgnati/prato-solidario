export const dynamic = 'force-dynamic'
import { listAccumulatedMeals } from '@/actions/admin-list.actions'
import { MarmitasAcumuladasClient } from './MarmitasAcumuladasClient'

export const metadata = { title: 'Marmitas Acumuladas — Admin' }

export default async function MarmitasAcumuladasPage() {
  const res = await listAccumulatedMeals({ limit: 100 })

  return (
    <MarmitasAcumuladasClient
      initialData={res.data ?? []}
      totalCreditos={res.totalCreditos ?? 0}
    />
  )
}
