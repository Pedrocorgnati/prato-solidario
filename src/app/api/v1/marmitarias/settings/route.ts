/**
 * GET  /api/v1/marmitarias/settings — retorna configurações atuais para popular o formulário
 * PUT  /api/v1/marmitarias/settings — atualiza schedule, preço, foto e endereço público
 *
 * @see module-14-painel-marmitaria/TASK-4/ST002
 * INT-046: Configurações | INT-101: Horários
 * USER_023: Foto obrigatória | USER_024: Preço mínimo | USER_025: Dias obrigatórios (validado no schema)
 * LGPD: endereço público expõe apenas bairro e cidade (nunca endereço completo)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { marmitariaSettingsService, PriceLockedError, PhotoRequiredError } from '@/services/marmitaria-settings.service'
import { errorResponse } from '@/types/api'
import { settingsUpdateSchema } from '@/schemas/marmitaria.schema'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET — Busca configurações atuais
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const user = await requireRole(['MARMITARIA'])

    const settings = await marmitariaSettingsService.getSettings(user.id)
    if (!settings) {
      return NextResponse.json(
        errorResponse('Perfil de marmitaria não encontrado', 'AUTH_008'),
        { status: 404 }
      )
    }

    return NextResponse.json(settings)
  } catch (err) {
    console.error('[GET /api/v1/marmitarias/settings] Erro interno:', err)
    return NextResponse.json(
      errorResponse('Erro interno ao buscar configurações', 'SYS_001'),
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// PUT — Atualiza configurações
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    // 1. Autenticação
    const user = await requireRole(['MARMITARIA'])

    // 2. Carregar perfil
    const profile = await marmitariaRepository.findProfileByUserId(user.id)
    if (!profile) {
      return NextResponse.json(
        errorResponse('Perfil de marmitaria não encontrado', 'AUTH_008'),
        { status: 404 }
      )
    }

    // 3. Verificar status ACTIVE
    if (!marmitariaRepository.isActive(profile.status)) {
      const code = marmitariaRepository.getStatusErrorCode(profile.status)
      return NextResponse.json(
        errorResponse('Marmitaria não está ativa', code),
        { status: 403 }
      )
    }

    // 4. Parse e validação do body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        errorResponse('Body da requisição inválido', 'VAL_001'),
        { status: 400 }
      )
    }

    const parseResult = settingsUpdateSchema.safeParse(body)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      const fieldPath = firstError?.path?.join('.') ?? 'desconhecido'
      const fieldErrors: Record<string, string[]> = {}

      parseResult.error.issues.forEach((issue) => {
        const path = issue.path.join('.') || 'geral'
        if (!fieldErrors[path]) fieldErrors[path] = []
        fieldErrors[path].push(issue.message)
      })

      return NextResponse.json(
        errorResponse(
          firstError?.message ?? 'Dados inválidos',
          firstError?.path?.includes('schedule') ? 'SCHEDULE_DAYS_REQUIRED' : 'VAL_001',
          fieldErrors
        ),
        { status: 422 }
      )
    }

    // 5. Delegar ao service (valida USER_023 e USER_024, invalida cache)
    const currentPhotoUrl = profile.user?.photoUrl ?? null
    const result = await marmitariaSettingsService.updateSettings(
      user.id,
      profile.id,
      parseResult.data,
      currentPhotoUrl
    )

    return NextResponse.json(result)
  } catch (err: unknown) {
    if (err instanceof PhotoRequiredError) {
      return NextResponse.json(
        errorResponse(err.message, 'PHOTO_REQUIRED'),
        { status: 422 }
      )
    }

    if (err instanceof PriceLockedError) {
      return NextResponse.json(
        errorResponse(err.message, 'PRICE_LOCKED'),
        { status: 409 }
      )
    }

    const error = err as { code?: string; message?: string }
    if (error?.code === 'INVALID_PRICE') {
      return NextResponse.json(
        errorResponse(error.message ?? 'Preço inválido', 'INVALID_PRICE'),
        { status: 422 }
      )
    }

    console.error('[PUT /api/v1/marmitarias/settings] Erro interno:', err)
    return NextResponse.json(
      errorResponse('Erro interno ao salvar configurações', 'SYS_001'),
      { status: 500 }
    )
  }
}
