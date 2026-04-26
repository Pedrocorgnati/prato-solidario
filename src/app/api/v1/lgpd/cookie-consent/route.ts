/**
 * POST /api/v1/lgpd/cookie-consent — registra consentimento de cookies para usuario autenticado.
 * @see intake-review/TASK-5/ST003 — CL-279 + CL-253
 */

import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null)
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(errorResponse('Body invalido', 'VAL_001'), { status: 400 })
    }

    const payload = body as { categories?: { analytics?: boolean; marketing?: boolean }; version?: string }
    if (!payload?.categories) {
      return NextResponse.json(errorResponse('categories obrigatorio', 'VAL_001'), { status: 422 })
    }

    if (!session?.id) {
      // usuario anonimo: consent ja esta em cookie first-party — retorna 204
      return new NextResponse(null, { status: 204 })
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'cookie_consent_updated',
        entityType: 'CookieConsent',
        metadata: {
          analytics: !!payload.categories.analytics,
          marketing: !!payload.categories.marketing,
          version: payload.version ?? 'v1',
        },
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[POST /api/v1/lgpd/cookie-consent]', err)
    return NextResponse.json(errorResponse('Erro interno', 'SYS_001'), { status: 500 })
  }
}
