/**
 * POST /api/v1/codes/{id}/report
 * Receptor reporta ausência do doador:
 *   1. Cancela o código ACTIVE e devolve porções ao pool da doação
 *   2. Busca a próxima doação disponível na mesma região
 *   3. Retorna nextDonation { id, donorBairro, donorCidade, windowEnd } | null
 *
 * Acessível para RECEPTOR e ONG (donos do código).
 * Mantém compatibilidade com a forma original (description no body).
 * @see intake-review/TASK-1 — gaps CL-083, CL-084
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'
import { matchingService } from '@/services/matching.service'
import { DonationStatus } from '@/types/enums'

const uuidSchema = z.string().uuid('ID deve ser um UUID válido.')

const reportBodySchema = z.object({
  description: z.string().min(1).max(1000).optional(),
  reason: z.string().optional(),
})

export async function POST(
  request: NextRequest,
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

  // 2. Autenticação
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'AUTH_001', message: 'Não autenticado.' }, { status: 401 })
  }

  // 3. Validar body (permissivo — description pode ser curta no fluxo de ausência)
  let description = 'no_show'
  try {
    const raw = await request.json()
    const bodyParsed = reportBodySchema.safeParse(raw)
    if (bodyParsed.success) {
      description = bodyParsed.data.description ?? bodyParsed.data.reason ?? 'no_show'
    }
  } catch {
    // body opcional
  }

  try {
    // 4. Buscar código com dados da doação
    const code = await prisma.retrievalCode.findUnique({
      where: { id },
      include: {
        donation: {
          select: {
            id: true,
            donorId: true,
            remainingPortions: true,
            portions: true,
            status: true,
            type: true,
            windowStart: true,
            windowEnd: true,
          },
        },
      },
    })

    if (!code) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Código não encontrado.' }, { status: 404 })
    }

    // 5. Verificar que o chamador é o receptor do código OU ONG/admin
    const isOwner = code.receptorId === session.id
    const isOng = (session.role as string) === 'ONG'
    const isAdmin = (session.role as string) === 'ADMIN'
    if (!isOwner && !isOng && !isAdmin) {
      return NextResponse.json(
        { error: 'AUTH_003', message: 'Você não tem permissão para reportar este código.' },
        { status: 403 }
      )
    }

    if (code.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'SYS_053', message: 'Código não está ativo.' },
        { status: 422 }
      )
    }

    // 6. Transação: cancelar código + liberar porções + audit
    await prisma.$transaction(async (tx) => {
      // Cancelar código com reason NO_SHOW_REPORT
      await tx.retrievalCode.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })

      // Devolver porções ao pool (apenas REGULAR — SPONSORED não retorna ao pool)
      if (code.donation.type !== 'SPONSORED') {
        await tx.donation.update({
          where: { id: code.donationId },
          data: { remainingPortions: { increment: code.portions } },
        })

        // Se doação estava RESERVED e todas as porções foram devolvidas → AVAILABLE
        const refreshed = await tx.donation.findUnique({
          where: { id: code.donationId },
          select: { remainingPortions: true, portions: true, status: true },
        })
        if (
          refreshed &&
          refreshed.status === DonationStatus.RESERVED &&
          refreshed.remainingPortions >= refreshed.portions
        ) {
          await tx.donation.update({
            where: { id: code.donationId },
            data: { status: DonationStatus.AVAILABLE },
          })
        }
      }

      await tx.auditLog.create({
        data: {
          action: 'NO_SHOW_REPORT',
          entityType: 'RetrievalCode',
          entityId: id,
          userId: session.id,
          metadata: {
            donationId: code.donationId,
            portions: code.portions,
            description,
          },
        },
      })
    })

    // 7. Buscar próxima doação disponível na mesma região (ST002)
    const nextDonation = await matchingService.findNextAvailable({
      donationId: code.donationId,
      quantity: code.portions,
    })

    return NextResponse.json({
      success: true,
      message: 'Ausência registrada. Código cancelado e porções devolvidas.',
      nextDonation,
    })
  } catch (err) {
    console.error('[POST /api/v1/codes/:id/report]', err)
    return NextResponse.json({ error: 'SYS_001', message: 'Erro interno.' }, { status: 500 })
  }
}
