export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/session'
import { getProfileByUserId } from '@/services/profile.service'
import { ProfileForm } from './ProfileForm'

/**
 * Página de edição de perfil.
 * @see module-6-profile-lgpd/TASK-1/ST003
 */
export const metadata = { title: 'Meu Perfil — Prato Solidário' }

export default async function PerfilPage() {
  const session = await requireSession()
  const profile = await getProfileByUserId(session.id)

  if (!profile) redirect('/entrar')

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Caminho de navegação" className="text-sm text-muted-foreground">
        <span>Minha conta</span>
        <span className="mx-1" aria-hidden="true">&rsaquo;</span>
        <span className="font-medium text-foreground">Perfil</span>
      </nav>

      <h1 className="text-2xl font-semibold">Meu Perfil</h1>

      <ProfileForm user={profile} />
    </div>
  )
}
