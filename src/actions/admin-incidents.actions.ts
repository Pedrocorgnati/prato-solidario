'use server'

/**
 * Server Actions — fachada para ações de gestão de incidentes.
 * @see module-16-admin-gestao/TASK-3/ST005
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
  method: 'POST' | 'PATCH',
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}${path}`, {
    method,
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

function revalidateIncident(id: string) {
  revalidatePath('/admin/incidentes')
  revalidatePath(`/admin/incidentes/${id}`)
}

export async function startInvestigation(
  id: string,
  notas?: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const result = await callAdminApi(`/api/v1/admin/incidents/${id}`, 'PATCH', {
    action: 'START_INVESTIGATION',
    notas,
  })
  if (result.success) revalidateIncident(id)
  return result
}

export async function warnUser(
  id: string,
  notas: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const result = await callAdminApi(`/api/v1/admin/incidents/${id}`, 'PATCH', {
    action: 'WARN_USER',
    notas,
  })
  if (result.success) revalidateIncident(id)
  return result
}

export async function suspendUserFromIncident(
  id: string,
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const result = await callAdminApi(`/api/v1/admin/incidents/${id}`, 'PATCH', {
    action: 'SUSPEND_USER',
    notas: motivo,
  })
  if (result.success) revalidateIncident(id)
  return result
}

export async function resolveIncident(
  id: string,
  notas?: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const result = await callAdminApi(`/api/v1/admin/incidents/${id}/resolve`, 'POST', {
    notas,
  })
  if (result.success) revalidateIncident(id)
  return result
}

export async function saveInvestigationNotes(
  id: string,
  notas: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  // Salva notas sem mudar status — usa PATCH com ação especial
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/v1/admin/incidents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START_INVESTIGATION', notas }),
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return { success: false, error: data.code ?? 'SYS_001' }
  }
  revalidateIncident(id)
  return { success: true }
}
