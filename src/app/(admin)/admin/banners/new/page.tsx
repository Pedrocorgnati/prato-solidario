export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BannerForm } from '../components/BannerForm'

export const metadata: Metadata = { title: 'Nova Campanha — Admin | Prato Solidário' }

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/banners" className="text-sm text-[var(--color-text-secondary)] hover:underline flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Nova campanha de banner</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Campanha criada com status <strong>Rascunho</strong>. Ative-a quando estiver pronta.
        </p>
      </div>
      <BannerForm mode="create" />
    </div>
  )
}
