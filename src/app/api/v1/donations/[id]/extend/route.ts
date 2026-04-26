/**
 * POST /api/v1/donations/{id}/extend
 * Estende a janela de doação em 30 minutos. Máximo de 2 extensões por doação.
 * Apenas o doador dono da doação pode chamar este endpoint.
 *
 * Validações:
 *   - Doação pertence ao usuário autenticado (role DOADOR_PF ou DOADOR_RESTAURANTE)
 *   - Status AVAILABLE ou RESERVED (não EXPIRED/CANCELLED/COMPLETED)
 *   - windowEnd ainda não passou (janela ativa)
 *   - extensionCount < 2 (máximo 2 extensões)
 *
 * @see intake-review/TASK-2 — gaps CL-086, CL-087
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'

const uuidSchema = z.string().uuid('ID deve ser um UUID válido.')

const EXTENSION_MINUTES = 30
const MAX_EXTENSIONS = 2
const ALLOWED_STATUSES = ['AVAILABLE', 'RESERVED']
const ALLOWED_ROLES = ['DOADOR_PF', 'DOADOR_RESTAURANTE']

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 1. Validar UUID
  const parsed = uuidSchema.safeParse(id)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VAL_002', message: 'ID inválido. Deve ser um UUID.' },
      { status: 400 }
    )
  }

  // 2. Autenticação + role
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'AUTH_001', message: 'Não autenticado.' }, { status: 401 })
  }
  if (!ALLOWED_ROLES.includes(session.role as string)) {
    return NextResponse.json(
      { error: 'AUTH_004', message: 'Apenas doadores podem estender doações.' },
      { status: 403 }
    )
  }

  try {
    // 3. Buscar doação
    const donation = await prisma.donation.findUnique({
      where: { id },
      select: {
        id: true,
        donorId: true,
        status: true,
        windowEnd: true,
        extensionCount: true,
      },
    })

    if (!donation) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Doação não encontrada.' }, { status: 404 })
    }

    // 4. Verificar ownership
    if (donation.donorId !== session.id) {
      return NextResponse.json(
        { error: 'AUTH_003', message: 'Você não tem permissão para estender esta doação.' },
        { status: 403 }
      )
    }

    // 5. Validar status
    if (!ALLOWED_STATUSES.includes(donation.status)) {
      return NextResponse.json(
        {
          error: 'SYS_010',
          message: `Não é possível estender uma doação com status ${donation.status}.`,
        },
        { status: 422 }
      )
    }

    // 6. Validar que a janela ainda não expirou
    const now = new Date()
    if (donation.windowEnd <= now) {
      return NextResponse.json(
        { error: 'SYS_011', message: 'A janela desta doação já expirou.' },
        { status: 422 }
      )
    }

    // 7. Validar limite de extensões
    if (donation.extensionCount >= MAX_EXTENSIONS) {
      return NextResponse.json(
        {
          error: 'SYS_012',
          message: `Máximo de ${MAX_EXTENSIONS} extensões atingido para esta doação.`,
        },
        { status: 422 }
      )
    }

    // 8. Estender windowEnd em 30 minutos e incrementar extensionCount
    const newWindowEnd = new Date(donation.windowEnd.getTime() + EXTENSION_MINUTES * 60 * 1000)
    const newExtensionCount = donation.extensionCount + 1

    const updated = await prisma.donation.update({
      where: { id },
      data: {
        windowEnd: newWindowEnd,
        extensionCount: newExtensionCount,
      },
      select: {
        id: true,
        windowEnd: true,
        extensionCount: true,
        status: true,
      },
    })

    // 9. AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'DONATION_EXTENDED',
        entityType: 'Donation',
        entityId: id,
        userId: session.id,
        metadata: {
          extensionCount: newExtensionCount,
          newWindowEnd: newWindowEnd.toISOString(),
          extensionMinutes: EXTENSION_MINUTES,
        },
      },
    })

    const extensoesRestantes = MAX_EXTENSIONS - newExtensionCount
    return NextResponse.json({
      success: true,
      message: `Janela estendida por ${EXTENSION_MINUTES} minutos.`,
      donation: updated,
      extensoesRestantes,
    })
  } catch (err) {
    console.error('[POST /api/v1/donations/:id/extend]', err)
    return NextResponse.json({ error: 'SYS_001', message: 'Erro interno.' }, { status: 500 })
  }
}
