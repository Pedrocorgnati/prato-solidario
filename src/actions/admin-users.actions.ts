'use server'

/**
 * Server Actions — fachada para ações admin de usuários.
 * Validam role ADMIN na session antes de chamar as APIs internas.
 * @see module-16-admin-gestao/TASK-1/ST005
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
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
    credentials: 'include',
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return { success: false, error: data.code ?? 'SYS_001' }
  }

  return { success: true }
}

export async function suspendUser(
  id: string,
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  if (!motivo || motivo.length < 10) {
    return { success: false, error: 'VAL_001' }
  }

  const result = await callAdminApi(`/api/v1/admin/users/${id}/suspend`, motivo)
  if (result.success) {
    revalidatePath('/admin/usuarios')
    revalidatePath('/admin/doadores')
  }
  return result
}

export async function reactivateUser(
  id: string,
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  if (!motivo || motivo.length < 10) {
    return { success: false, error: 'VAL_001' }
  }

  const result = await callAdminApi(`/api/v1/admin/users/${id}/reactivate`, motivo)
  if (result.success) {
    revalidatePath('/admin/usuarios')
    revalidatePath('/admin/doadores')
  }
  return result
}

export async function unblockReceptor(
  id: string,
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  if (!motivo || motivo.length < 10) {
    return { success: false, error: 'VAL_001' }
  }

  const result = await callAdminApi(`/api/v1/admin/users/${id}/unblock`, motivo)
  if (result.success) {
    revalidatePath('/admin/receptores')
    revalidatePath('/admin/usuarios')
  }
  return result
}
