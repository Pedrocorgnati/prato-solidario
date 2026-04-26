export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { DonationStatus } from '@prisma/client'
import { Loader2 } from 'lucide-react'
import { DeleteAccountForm } from './DeleteAccountForm'

/**
 * Página de exclusão de conta (LGPD Art. 18 IV).
 * @see module-6-profile-lgpd/TASK-5/ST001
 */
export const metadata = { title: 'Excluir Conta — Prato Solidário' }

async function ExcluirContaContent({ userId }: { userId: string }) {
  const activeDonationsCount = await prisma.donation.count({
    where: { donorId: userId, status: { in: [DonationStatus.AVAILABLE, DonationStatus.RESERVED] } },
  })
  return <DeleteAccountForm hasActiveDonations={activeDonationsCount > 0} />
}

export default async function ExcluirContaPage() {
  const session = await requireSession()

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Caminho de navegação" className="text-sm text-muted-foreground">
        <span>Minha conta</span>
        <span className="mx-1" aria-hidden="true">&rsaquo;</span>
        <span className="font-medium text-foreground">Excluir conta</span>
      </nav>

      <h1 className="text-2xl font-semibold text-destructive">Excluir Minha Conta</h1>

      <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}>
        <ExcluirContaContent userId={session.id} />
      </Suspense>
    </div>
  )
}
