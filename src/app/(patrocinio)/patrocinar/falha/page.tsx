export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export const metadata = { title: 'Pagamento não aprovado — Prato Solidário' }

interface Props {
  searchParams: Promise<{ purchase_id?: string; error_code?: string }>
}

export default async function FalhaPage({ searchParams }: Props) {
  const params = await searchParams
  const errorCode = params.error_code

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6">
      <div className="flex justify-center">
        <XCircle className="h-[72px] w-[72px] text-red-500" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Pagamento não aprovado
        </h1>
        <p className="mt-2 text-base text-[var(--color-text-muted)]">
          Ops! O pagamento não foi aprovado. Nenhum valor foi cobrado.
        </p>

        {errorCode && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Código: {errorCode}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="default" asChild>
          <Link href={ROUTES.PATROCINAR}>Tentar novamente</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.PATROCINAR}>Escolher outra marmitaria</Link>
        </Button>
      </div>
    </div>
  )
}
