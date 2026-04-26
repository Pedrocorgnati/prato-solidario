export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { CheckCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { getSponsorshipById } from '@/actions/sponsors'
import { getServerSession } from '@/lib/auth/session'
import { formatDateTimeBr } from '@/utils/date'

export const metadata = { title: 'Patrocínio Confirmado — Prato Solidário' }

interface Props {
  searchParams: Promise<{ purchase_id?: string }>
}

export default async function SucessoPage({ searchParams }: Props) {
  const params = await searchParams
  const purchaseId = params.purchase_id
  const session = await getServerSession()

  // Tenta buscar dados reais da compra
  const purchase = purchaseId
    ? await getSponsorshipById(purchaseId)
    : { data: null, error: null }

  const data = purchase.data

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="h-[72px] w-[72px] text-[var(--color-success)]" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Patrocínio realizado com sucesso!
        </h1>

        {data ? (
          <>
            <p className="mt-2 text-base text-[var(--color-text-secondary)]">
              Você patrocinou {data.quantity} refeições para {data.marmitariaName}.
            </p>

            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Transação: {data.id}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Data: {formatDateTimeBr(data.createdAt)}
            </p>

            {data.guestEmail && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/50 p-4 text-left">
                <Mail className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Um e-mail de confirmação foi enviado para {data.guestEmail}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-base text-[var(--color-text-secondary)]">
            Obrigado por fazer a diferença! Seu patrocínio foi registrado com sucesso.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="outline" asChild>
          <Link href={ROUTES.PATROCINAR}>Patrocinar mais marmitarias</Link>
        </Button>

        {session && (
          <Button variant="ghost" asChild>
            <Link href={ROUTES.PATROCINAR_HISTORICO}>Ver meu histórico</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
