/**
 * POST /api/v1/codes/confirm-all
 * Dá baixa em todos os códigos ACTIVE da ONG autenticada (transação atômica).
 * Apenas ONG pode acessar este endpoint.
 * @see module-10-codigos-historico/TASK-2/ST004 e ST005
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'
import { retrievalRepository } from '@/repositories/retrieval.repository'
import { bannerService } from '@/services/banner.service'
import { DonationStatus } from '@/types/enums'

// Rate limit: 5 req/hora por ongId (operação destrutiva irreversível) — ST004
const confirmAllRateLimit = new Map<string, { count: number; resetAt: number }>()
const CONFIRM_ALL_RATE_LIMIT = 5
const CONFIRM_ALL_WINDOW_MS = 60 * 60 * 1000 // 1 hora

export async function POST() {
  // 1. Autenticação e role ONG (ST001)
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json(
      { error: 'AUTH_001', message: 'Não autenticado.' },
      { status: 401 }
    )
  }
  if ((session.role as string) !== 'ONG') {
    return NextResponse.json(
      { error: 'AUTH_004', message: 'Acesso restrito a ONGs.' },
      { status: 403 }
    )
  }

  // 2. Rate limit: 5 req/hora por ONG
  const rlKey = session.id
  const rlEntry = confirmAllRateLimit.get(rlKey)
  const now = Date.now()
  if (rlEntry && now < rlEntry.resetAt) {
    rlEntry.count++
    if (rlEntry.count > CONFIRM_ALL_RATE_LIMIT) {
      return NextResponse.json(
        { error: 'RATE_001', message: 'Limite de confirmações em lote atingido. Aguarde 1 hora.' },
        { status: 429 }
      )
    }
  } else {
    confirmAllRateLimit.set(rlKey, { count: 1, resetAt: now + CONFIRM_ALL_WINDOW_MS })
  }

  // 3. Buscar todos os códigos ACTIVE da ONG
  const activeCodes = await retrievalRepository.getAllActiveCodesByOngId(session.id)

  if (!activeCodes.length) {
    return NextResponse.json({
      confirmed: 0,
      message: 'Nenhum código ativo para confirmar.',
    })
  }

  // 4. Segurança: verificar que TODOS os códigos pertencem à ONG (ST005 — anti-IDOR)
  const allBelongToOng = activeCodes.every((c) => c.receptorId === session.id)
  if (!allBelongToOng) {
    await prisma.auditLog.create({
      data: {
        action: 'UNAUTHORIZED_BULK_CONFIRM_ATTEMPT',
        entityType: 'RetrievalCode',
        userId: session.id,
        metadata: { ongId: session.id, codeCount: activeCodes.length },
      },
    })
    return NextResponse.json(
      { error: 'AUTH_003', message: 'Inconsistência de dados detectada. Operação abortada.' },
      { status: 403 }
    )
  }

  // 5. Transação atômica — tudo ou nada
  try {
    const codeIds = activeCodes.map((c) => c.id)
    const donationIds = [...new Set(activeCodes.map((c) => c.donationId))]
    const confirmedAt = new Date()

    const donationResults = await prisma.$transaction(async (tx) => {
      // Confirmar todos os códigos
      await tx.retrievalCode.updateMany({
        where: { id: { in: codeIds }, receptorId: session.id },
        data: { status: 'CONFIRMED', confirmedAt },
      })

      // Atualizar remainingPortions por doação e checar COMPLETED
      const updatedDonations: { id: string; status: string; donorId: string }[] = []
      for (const donationId of donationIds) {
        const codesForDonation = activeCodes.filter((c) => c.donationId === donationId)
        const totalPortions = codesForDonation.reduce((sum, c) => sum + c.portions, 0)

        const updated = await tx.donation.update({
          where: { id: donationId },
          data: { remainingPortions: { decrement: totalPortions } },
          select: { id: true, remainingPortions: true, status: true, donorId: true },
        })

        let finalStatus = updated.status
        if (updated.remainingPortions <= 0) {
          await tx.donation.update({
            where: { id: donationId },
            data: { status: DonationStatus.COMPLETED },
          })
          finalStatus = DonationStatus.COMPLETED
        }

        updatedDonations.push({ id: donationId, status: finalStatus, donorId: updated.donorId })
      }

      // AuditLog da operação
      await tx.auditLog.create({
        data: {
          action: 'BULK_CONFIRM',
          entityType: 'RetrievalCode',
          userId: session.id,
          metadata: {
            confirmedCount: codeIds.length,
            donationIds,
            ongId: session.id,
          },
        },
      })

      return updatedDonations
    })

    // Crédito de banner para doações COMPLETED (fire-and-forget)
    const completedDonations = donationResults.filter((d) => d.status === DonationStatus.COMPLETED)
    for (const d of completedDonations) {
      bannerService.creditBannerDay(d.donorId, d.id).catch((err) =>
        console.warn('[confirm-all] Erro ao creditar banner:', err)
      )
    }

    return NextResponse.json({
      confirmed: codeIds.length,
      donations: donationResults,
    })
  } catch (err) {
    // Registrar falha mesmo em erro (ST005)
    await prisma.auditLog.create({
      data: {
        action: 'BULK_CONFIRM_FAILED',
        entityType: 'RetrievalCode',
        userId: session.id,
        metadata: { ongId: session.id, error: err instanceof Error ? err.message : 'unknown' },
      },
    }).catch(() => {})

    console.error('[POST /api/v1/codes/confirm-all]', err)
    return NextResponse.json(
      { error: 'SYS_001', message: 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}
