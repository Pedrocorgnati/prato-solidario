'use server'

/**
 * Server Actions — fachada para aprovação/rejeição de marmitarias.
 * @see module-16-admin-gestao/TASK-2/ST005
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

async function callAdminApi(
  path: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return { success: false, error: data.code ?? 'SYS_001' }
  }

  return { success: true }
}

export async function approveMarmitaria(
  id: string,
  observacoes?: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const result = await callAdminApi(
    `/api/v1/admin/marmitarias/${id}/approve`,
    { observacoes }
  )

  if (result.success) {
    revalidatePath('/admin/marmitarias')
    revalidatePath(`/admin/marmitarias/${id}`)
  }
  return result
}

export async function rejectMarmitaria(
  id: string,
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  if (!motivo || motivo.length < 20) {
    return { success: false, error: 'VAL_001' }
  }

  const result = await callAdminApi(
    `/api/v1/admin/marmitarias/${id}/reject`,
    { motivo }
  )

  if (result.success) {
    revalidatePath('/admin/marmitarias')
    revalidatePath(`/admin/marmitarias/${id}`)
  }
  return result
}
