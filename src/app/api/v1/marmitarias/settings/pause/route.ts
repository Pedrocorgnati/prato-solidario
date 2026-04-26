/**
 * POST   /api/v1/marmitarias/settings/pause — pausa a marmitaria (suspende novos patrocinios)
 * DELETE /api/v1/marmitarias/settings/pause — retoma (status ACTIVE)
 *
 * @see intake-review/TASK-1/ST003 — CL-262 (pausar marmitaria)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { marmitariaSettingsService } from '@/services/marmitaria-settings.service'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['MARMITARIA'])
    let reason: string | undefined
    try {
      const body = (await request.json()) as { reason?: string }
      reason = body?.reason
    } catch {
      // corpo opcional
    }
    const result = await marmitariaSettingsService.pauseMarmitaria(user.id, reason)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    if (error?.code === 'INVALID_STATE') {
      return NextResponse.json(errorResponse(error.message ?? 'Estado invalido', 'INVALID_STATE'), { status: 409 })
    }
    if (error?.code === 'AUTH_008') {
      return NextResponse.json(errorResponse(error.message ?? 'Nao encontrada', 'AUTH_008'), { status: 404 })
    }
    console.error('[POST /api/v1/marmitarias/settings/pause]', err)
    return NextResponse.json(errorResponse('Erro interno', 'SYS_001'), { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await requireRole(['MARMITARIA'])
    const result = await marmitariaSettingsService.resumeMarmitaria(user.id)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    if (error?.code === 'INVALID_STATE') {
      return NextResponse.json(errorResponse(error.message ?? 'Estado invalido', 'INVALID_STATE'), { status: 409 })
    }
    if (error?.code === 'AUTH_008') {
      return NextResponse.json(errorResponse(error.message ?? 'Nao encontrada', 'AUTH_008'), { status: 404 })
    }
    console.error('[DELETE /api/v1/marmitarias/settings/pause]', err)
    return NextResponse.json(errorResponse('Erro interno', 'SYS_001'), { status: 500 })
  }
}
