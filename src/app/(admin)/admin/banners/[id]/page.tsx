export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BannerForm } from '../components/BannerForm'

export const metadata: Metadata = { title: 'Editar Campanha — Admin | Prato Solidário' }

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Carregar campanha do servidor
  let defaultValues: Record<string, unknown> | undefined
  let loadError = false
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/admin/banners?page=1&limit=1`, {
      next: { revalidate: 0 },
    })
    if (res.ok) {
      const data = await res.json()
      const found = data.data?.find((c: Record<string, unknown>) => c.id === id)
      if (found) defaultValues = found
      else loadError = true
    } else {
      loadError = true
    }
  } catch {
    loadError = true
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/banners" className="text-sm text-[var(--color-text-secondary)] hover:underline flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Editar campanha</h1>
      </div>
      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar os dados da campanha. Verifique se o ID é válido ou tente novamente.
        </div>
      )}
      <BannerForm
        mode="edit"
        campaignId={id}
        defaultValues={defaultValues as Parameters<typeof BannerForm>[0]['defaultValues']}
      />
    </div>
  )
}
