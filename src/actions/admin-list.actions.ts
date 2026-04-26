'use server'

/**
 * Server Actions para listagem de dados admin.
 * Substituem os stubs em admin.ts e marmitarias.ts.
 * @see module-16-admin-gestao
 */

import { getServerSession } from '@/lib/auth/session'

async function requireAdminFetch(path: string): Promise<Response> {
  const session = await getServerSession()
  if (!session || (session.role as string) !== 'ADMIN') {
    throw new Error('AUTH_003')
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return fetch(`${baseUrl}${path}`, {
    credentials: 'include',
    cache: 'no-store',
  })
}

export async function listUsersAdmin(params?: {
  role?: string
  status?: string
  page?: number
  limit?: number
}) {
  try {
    const sp = new URLSearchParams()
    if (params?.role) sp.set('role', params.role)
    if (params?.status) sp.set('status', params.status)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.limit) sp.set('limit', String(params.limit))

    const res = await requireAdminFetch(`/api/v1/admin/users?${sp.toString()}`)
    if (!res.ok) return { data: [], total: 0, page: 1, limit: 20 }
    return await res.json()
  } catch {
    return { data: [], total: 0, page: 1, limit: 20 }
  }
}

export async function listMarmitariasAdmin(params?: {
  status?: string
  page?: number
  limit?: number
}) {
  try {
    const sp = new URLSearchParams()
    if (params?.status) sp.set('status', params.status)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.limit) sp.set('limit', String(params.limit))

    const res = await requireAdminFetch(`/api/v1/admin/marmitarias?${sp.toString()}`)
    if (!res.ok) return { data: [], total: 0 }
    return await res.json()
  } catch {
    return { data: [], total: 0 }
  }
}

export async function listIncidentsAdmin(params?: {
  type?: string
  status?: string
  period?: string
  page?: number
  limit?: number
}) {
  try {
    const sp = new URLSearchParams()
    if (params?.type) sp.set('type', params.type)
    if (params?.status) sp.set('status', params.status)
    if (params?.period) sp.set('period', params.period)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.limit) sp.set('limit', String(params.limit))

    const res = await requireAdminFetch(`/api/v1/admin/incidents?${sp.toString()}`)
    if (!res.ok) return { data: [], total: 0, openCount: 0 }
    return await res.json()
  } catch {
    return { data: [], total: 0, openCount: 0 }
  }
}

export async function listPartnersAdmin(params?: {
  type?: string
  status?: string
  page?: number
  limit?: number
}) {
  try {
    const sp = new URLSearchParams()
    if (params?.type) sp.set('type', params.type)
    if (params?.status) sp.set('status', params.status)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.limit) sp.set('limit', String(params.limit))

    const res = await requireAdminFetch(`/api/v1/admin/partners?${sp.toString()}`)
    if (!res.ok) return { data: [], total: 0 }
    return await res.json()
  } catch {
    return { data: [], total: 0 }
  }
}

export async function getIncidentDetail(id: string) {
  try {
    const res = await requireAdminFetch(`/api/v1/admin/incidents/${id}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function listAccumulatedMeals(params?: {
  minCredits?: number
  page?: number
  limit?: number
}) {
  try {
    const sp = new URLSearchParams()
    if (params?.minCredits) sp.set('min_credits', String(params.minCredits))
    if (params?.page) sp.set('page', String(params.page))
    if (params?.limit) sp.set('limit', String(params.limit))

    const res = await requireAdminFetch(`/api/v1/admin/sponsored-meals/accumulated?${sp.toString()}`)
    if (!res.ok) return { data: [], totalCreditos: 0, total: 0 }
    return await res.json()
  } catch {
    return { data: [], totalCreditos: 0, total: 0 }
  }
}
