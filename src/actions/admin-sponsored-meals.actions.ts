'use server'

/**
 * Server Actions — fachada para notificações de marmitas acumuladas.
 * @see module-16-admin-gestao/TASK-5/ST004
 */

import { revalidatePath } from 'next/cache'
import { getServerSession } from '@/lib/auth/session'

async function requireAdmin(): Promise<{ id: string } | { error: string }> {
  const session = await getServerSession()
  if (!session || (session.role as string) !== 'ADMIN') {
    return { error: 'AUTH_003' }
  }
  return { id: session.id }
}

export async function notifyMarmitaria(
  marmitariaId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/v1/admin/sponsored-meals/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ marmitariaIds: [marmitariaId] }),
    credentials: 'include',
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return { success: false, error: data.code ?? 'SYS_001' }
  }

  revalidatePath('/admin/marmitas-acumuladas')
  return { success: true }
}

export async function notifyAllAccumulated(
  minCredits: number = 10
): Promise<{ success: boolean; notified?: number; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Buscar IDs elegíveis
  const listRes = await fetch(
    `${baseUrl}/api/v1/admin/sponsored-meals/accumulated?min_credits=${minCredits}&limit=200`,
    { credentials: 'include', cache: 'no-store' }
  )

  if (!listRes.ok) return { success: false, error: 'Falha ao buscar marmitarias' }

  const listData = await listRes.json()
  const ids = (listData.data ?? []).map((m: { marmitariaId: string }) => m.marmitariaId)

  if (ids.length === 0) return { success: true, notified: 0 }

  const notifyRes = await fetch(`${baseUrl}/api/v1/admin/sponsored-meals/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ marmitariaIds: ids }),
    credentials: 'include',
  })

  if (!notifyRes.ok) return { success: false, error: 'Falha ao enviar notificações' }

  const result = await notifyRes.json()
  revalidatePath('/admin/marmitas-acumuladas')
  return { success: true, notified: result.notified }
}
