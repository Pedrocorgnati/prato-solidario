export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'

/**
 * Rota raiz /conta → redireciona para /conta/perfil.
 * @see module-6-profile-lgpd/TASK-0/ST001
 */
export default function ContaPage() {
  redirect('/conta/perfil')
}
