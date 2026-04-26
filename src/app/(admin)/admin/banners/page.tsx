export const dynamic = 'force-dynamic'
/**
 * /admin/banners — Lista de campanhas de banner (Admin)
 * DataTable paginada com filtros e ações inline.
 * @see module-17-banners-system/TASK-1/ST001
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { AdminBannersTable } from './components/AdminBannersTable'

export const metadata: Metadata = { title: 'Banners — Admin | Prato Solidário' }

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT:     { label: 'Rascunho',  variant: 'secondary' },
  ACTIVE:    { label: 'Ativo',     variant: 'default' },
  PAUSED:    { label: 'Pausado',   variant: 'outline' },
  SCHEDULED: { label: 'Agendado', variant: 'secondary' },
  COMPLETED: { label: 'Concluído', variant: 'secondary' },
  REJECTED:  { label: 'Removido', variant: 'destructive' },
}

export { STATUS_LABELS }

export default function AdminBannersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Campanhas de Banner
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Gerencie campanhas pagas, por crédito e de permuta.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/banners/permuta">
            <Button variant="outline" size="sm">Acordos de permuta</Button>
          </Link>
          <Link href="/admin/banners/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova campanha
            </Button>
          </Link>
        </div>
      </div>

      <AdminBannersTable />
    </div>
  )
}
