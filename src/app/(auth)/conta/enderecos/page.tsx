export const dynamic = 'force-dynamic'
import { requireSession } from '@/lib/auth/session'
import { addressRepository } from '@/repositories/address.repository'
import { AddressManager } from './AddressManager'

/**
 * Página de gestão de endereços salvos.
 * @see module-6-profile-lgpd/TASK-2/ST001
 */
export const metadata = { title: 'Meus Endereços — Prato Solidário' }

export default async function EnderecosPage() {
  const session = await requireSession()
  const addresses = await addressRepository.findByUserId(session.id)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Caminho de navegação" className="text-sm text-muted-foreground">
        <span>Minha conta</span>
        <span className="mx-1" aria-hidden="true">&rsaquo;</span>
        <span className="font-medium text-foreground">Endereços</span>
      </nav>

      <h1 className="text-2xl font-semibold">Meus Endereços</h1>

      <AddressManager initialAddresses={addresses} />
    </div>
  )
}
