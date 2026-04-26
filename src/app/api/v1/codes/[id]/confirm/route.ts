/**
 * POST /api/v1/codes/{id}/confirm
 * Confirma retirada individual. Apenas o doador dono da doação pode confirmar.
 * @see module-10-codigos-historico/TASK-1/ST003 e ST005
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import { retrievalRepository } from '@/repositories/retrieval.repository'
import { donationRepository } from '@/repositories/donation.repository'
import { bannerService } from '@/services/banner.service'
import { DonationStatus } from '@/types/enums'

// Rate limit: 10 confirmações/min por userId
const confirmRateLimit = new Map<string, { count: number; resetAt: number }>()
const CONFIRM_RATE_LIMIT = 10

const uuidSchema = z.string().uuid('ID deve ser um UUID válido.')

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 1. Validar UUID (ST005/VAL_002)
  const parsed = uuidSchema.safeParse(id)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VAL_002', message: 'ID inválido. Deve ser um UUID.' },
      { status: 400 }
    )
  }

  // 2. Autenticação
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json(
      { error: 'AUTH_001', message: 'Não autenticado.' },
      { status: 401 }
    )
  }

  // 3. Rate limit: 10 confirm/min por userId (ST005)
  const rlKey = session.id
  const rlEntry = confirmRateLimit.get(rlKey)
  const now = Date.now()
  if (rlEntry && now < rlEntry.resetAt) {
    rlEntry.count++
    if (rlEntry.count > CONFIRM_RATE_LIMIT) {
      return NextResponse.json(
        { error: 'RATE_001', message: 'Limite de confirmações atingido. Aguarde antes de tentar novamente.' },
        { status: 429 }
      )
    }
  } else {
    confirmRateLimit.set(rlKey, { count: 1, resetAt: now + 60_000 })
  }

  // 4. Buscar código
  const record = await retrievalRepository.findByIdWithDonation(id)
  if (!record) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Código não encontrado.' },
      { status: 404 }
    )
  }

  // 5. Verificar ownership — doador deve ser dono da doação (ST005)
  if (record.donation.donorId !== session.id) {
    // Registrar tentativa não autorizada no AuditLog
    await auditLogRepository.log('UNAUTHORIZED_CONFIRM_ATTEMPT', 'RetrievalCode', {
      userId: session.id,
      entityId: id,
      metadata: { donationId: record.donationId, attemptedBy: session.id },
    })
    return NextResponse.json(
      { error: 'AUTH_003', message: 'Você não tem permissão para confirmar este código.' },
      { status: 403 }
    )
  }

  // 6. Verificar status
  if (record.status === 'EXPIRED') {
    return NextResponse.json(
      { error: 'SYS_051', message: 'Este código expirou. O receptor deve solicitar um novo.' },
      { status: 422 }
    )
  }
  if (record.status === 'CONFIRMED') {
    return NextResponse.json(
      { error: 'SYS_050', message: 'Este código já foi confirmado.' },
      { status: 409 }
    )
  }
  if (record.status === 'CANCELLED') {
    return NextResponse.json(
      { error: 'SYS_052', message: 'Este código foi cancelado.' },
      { status: 422 }
    )
  }

  // 7. Confirmar em transação atômica
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Confirmar código
      const confirmed = await tx.retrievalCode.update({
        where: { id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      })

      // Decrementar remainingPortions
      const updatedDonation = await tx.donation.update({
        where: { id: record.donationId },
        data: { remainingPortions: { decrement: record.portions } },
      })

      // Se doação esgotada → COMPLETED
      if (updatedDonation.remainingPortions <= 0) {
        await tx.donation.update({
          where: { id: record.donationId },
          data: { status: DonationStatus.COMPLETED },
        })
      }

      // AuditLog
      await tx.auditLog.create({
        data: {
          action: 'CODE_CONFIRMED',
          entityType: 'RetrievalCode',
          entityId: id,
          userId: session.id,
          metadata: { donationId: record.donationId, portions: record.portions },
        },
      })

      return { confirmed, donationStatus: updatedDonation.remainingPortions <= 0 ? DonationStatus.COMPLETED : updatedDonation.status }
    })

    // Crédito de banner (fire-and-forget — Contrato 1)
    if (result.donationStatus === DonationStatus.COMPLETED) {
      bannerService.creditBannerDay(record.donation.donorId, record.donationId).catch((err) =>
        console.warn('[confirm] Erro ao creditar banner:', err)
      )
    }

    return NextResponse.json({
      success: true,
      donation: {
        status: result.donationStatus,
        id: record.donationId,
      },
    })
  } catch (err) {
    console.error('[POST /api/v1/codes/:id/confirm]', err)
    return NextResponse.json(
      { error: 'SYS_001', message: 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}
