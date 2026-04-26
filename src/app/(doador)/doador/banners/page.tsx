export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'

/**
 * /doador/banners — Redirecionado para /doador/campanhas (module-17).
 * Mantido para compatibilidade com links antigos.
 */
export default function BannersDoadorPage() {
  redirect('/doador/campanhas')
}
