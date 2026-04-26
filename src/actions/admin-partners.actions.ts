'use server'

/**
 * Server Actions — fachada para ações admin de parceiros (ONGs e Patrocinadores).
 * @see module-16-admin-gestao/TASK-4/ST004
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

export async function verifyPartner(
  id: string,
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  if (!motivo || motivo.length < 10) {
    return { success: false, error: 'VAL_001' }
  }

  const result = await callAdminApi(`/api/v1/admin/partners/${id}/verify`, {
    acao: 'VERIFY',
    motivo,
  })
  if (result.success) revalidatePath('/admin/parceiros')
  return result
}

export async function revokePartnerVerification(
  id: string,
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  if (!motivo || motivo.length < 10) {
    return { success: false, error: 'VAL_001' }
  }

  const result = await callAdminApi(`/api/v1/admin/partners/${id}/verify`, {
    acao: 'REVOKE',
    motivo,
  })
  if (result.success) revalidatePath('/admin/parceiros')
  return result
}

export async function suspendPartner(
  id: string,
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  if (!motivo || motivo.length < 10) {
    return { success: false, error: 'VAL_001' }
  }

  const result = await callAdminApi(`/api/v1/admin/partners/${id}/suspend`, { motivo })
  if (result.success) revalidatePath('/admin/parceiros')
  return result
}
