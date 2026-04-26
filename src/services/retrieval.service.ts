/**
 * RetrievalService — lógica de negócio para geração, confirmação e expiração
 * de códigos de retirada.
 * @see module-9-retirada-publica/TASK-1/ST002
 */

import { prisma } from '@/lib/prisma'
import { DonationStatus } from '@/types/enums'
import { retrievalRepository } from '@/repositories/retrieval.repository'
import { donationRepository } from '@/repositories/donation.repository'
import { endOfDayBRT } from '@/utils/date'
import type { RetrievalCode } from '@prisma/client'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Tunables para transacao atomica do matching (intake-review TASK-3)
// ---------------------------------------------------------------------------

/** Codigos de erro Postgres que indicam contencao recuperavel */
const SERIALIZATION_ERROR_CODES = new Set(['40001', '40P01']) // serialization_failure, deadlock_detected
/** Tentativas maximas antes de falhar definitivamente */
const MATCHING_MAX_ATTEMPTS = 3

function isSerializationError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const code = (err as { code?: string }).code
  if (code && SERIALIZATION_ERROR_CODES.has(code)) return true
  const msg = (err as { message?: string }).message ?? ''
  return /serialization|deadlock|could not serialize/i.test(msg)
}

function jitter(baseMs: number): number {
  return baseMs + Math.floor(Math.random() * baseMs)
}

/** Resultado do matching — usado como input para geração do código. */
export interface MatchingInput {
  donationId: string
  portions: number
}

// ---------------------------------------------------------------------------
// Erros de domínio
// ---------------------------------------------------------------------------

export class MarmitariaOutsideHoursError extends Error {
  code: string
  constructor(message: string, code: 'OUTSIDE_HOURS' | 'CLOSED_TODAY') {
    super(message)
    this.name = 'MarmitariaOutsideHoursError'
    this.code = code
  }
}

export class CodeAlreadyConfirmedError extends Error {
  constructor(code: string) {
    super(`SYS_050 — Código ${code} já foi confirmado.`)
    this.name = 'CodeAlreadyConfirmedError'
  }
}

export class CodeExpiredError extends Error {
  constructor(code: string) {
    super(`SYS_051 — Código ${code} está expirado.`)
    this.name = 'CodeExpiredError'
  }
}

export class DonationNotFoundError extends Error {
  constructor(id: string) {
    super(`SYS_080 — Doação ${id} não encontrada.`)
    this.name = 'DonationNotFoundError'
  }
}

// ---------------------------------------------------------------------------
// RetrievalService
// ---------------------------------------------------------------------------

export class RetrievalService {
  /**
   * Gera código de retirada para um matching confirmado.
   * Define expiresAt = 23:59:59 BRT do dia atual.
   * Atualiza Donation.remainingPortions via transação atômica.
   */
  async generateRetrievalCode(
    matching: MatchingInput,
    receptorId?: string | null,
    type: 'INDIVIDUAL' | 'FAMILY' = 'INDIVIDUAL'
  ): Promise<RetrievalCode> {
    const expiresAt = endOfDayBRT()

    // Retry loop para erros de serializacao sob concorrencia (intake-review TASK-3/ST001+ST004)
    let lastError: unknown = null
    for (let attempt = 1; attempt <= MATCHING_MAX_ATTEMPTS; attempt++) {
      try {
        return await prisma.$transaction(
          async (tx) => {
            // SELECT FOR UPDATE na doação — lock pessimistico previne race (INT-DB-008)
            const locked = await tx.$queryRaw<{ remaining_portions: number }[]>`
              SELECT remaining_portions
              FROM donations
              WHERE id = ${matching.donationId}::uuid
              FOR UPDATE
            `

            if (!locked.length) throw new DonationNotFoundError(matching.donationId)

            const currentRemaining = locked[0].remaining_portions
            if (currentRemaining < matching.portions) {
              throw new Error('DONATION_ALLOCATED — Porções insuficientes após lock.')
            }

            // Criar código dentro da transação
            const code = await this._generateCodeTx(tx, type, matching.portions)
            const retrievalCode = await tx.retrievalCode.create({
              data: {
                donationId: matching.donationId,
                receptorId: receptorId ?? null,
                code,
                type: type === 'FAMILY' ? 'FAMILY' : 'INDIVIDUAL',
                status: 'ACTIVE',
                portions: matching.portions,
                expiresAt,
              },
            })

            // Decrementar remainingPortions
            await tx.donation.update({
              where: { id: matching.donationId },
              data: { remainingPortions: { decrement: matching.portions } },
            })

            return retrievalCode
          },
          {
            isolationLevel: 'Serializable',
          },
        )
      } catch (err) {
        lastError = err
        if (isSerializationError(err) && attempt < MATCHING_MAX_ATTEMPTS) {
          logger.warn(
            {
              donationId: matching.donationId,
              attempt,
              maxAttempts: MATCHING_MAX_ATTEMPTS,
              err: String(err),
            },
            'matching.retry',
          )
          await new Promise((resolve) => setTimeout(resolve, jitter(50)))
          continue
        }
        // Erro nao-recuperavel ou tentativas esgotadas
        if (isSerializationError(err)) {
          logger.error(
            { donationId: matching.donationId, attempts: attempt },
            'matching.contention_exhausted',
          )
        }
        throw err
      }
    }
    // defensivo — inalcancavel
    throw lastError ?? new Error('matching.unknown_failure')
  }

  /**
   * Confirma código pelo doador. Atualiza doação para COMPLETED se esgotada.
   * Dispara evento banner.credit para marmitaria patrocinada (module-17).
   */
  async confirmCode(code: string): Promise<RetrievalCode> {
    const record = await retrievalRepository.findByCode(code)
    if (!record) throw new Error(`SYS_080 — Código ${code} não encontrado.`)
    if (record.status === 'CONFIRMED') throw new CodeAlreadyConfirmedError(code)
    if (record.status === 'EXPIRED' || record.expiresAt < new Date()) {
      throw new CodeExpiredError(code)
    }

    const confirmed = await retrievalRepository.confirm(record.id)

    // Se doação esgotada (remainingPortions <= 0): marcar como COMPLETED
    const donation = await donationRepository.findById(record.donationId)
    if (donation && donation.remainingPortions <= 0) {
      await donationRepository.updateStatus(record.donationId, DonationStatus.COMPLETED)
    }

    return confirmed
  }

  /**
   * Expira código. Se marmita patrocinada: retorna porção ao pool (INT-058).
   * Chamado pelo cron de expiração (module-23).
   */
  async expireCode(id: string): Promise<void> {
    const record = await prisma.retrievalCode.findUnique({
      where: { id },
      include: { donation: true },
    })
    if (!record) return

    await retrievalRepository.expire(id)

    // Marmita patrocinada expirada: restaurar remainingPortions
    if (record.donation.type === 'SPONSORED' && record.status === 'ACTIVE') {
      await donationRepository.updateStatus(record.donationId, DonationStatus.AVAILABLE)
      await prisma.donation.update({
        where: { id: record.donationId },
        data: { remainingPortions: { increment: record.portions } },
      })
    }
  }

  /**
   * Confirma código por ID (endpoint do doador). Inclui AuditLog.
   * @see module-10-codigos-historico/TASK-1/ST003
   */
  async confirmCodeById(codeId: string, donorId: string): Promise<RetrievalCode> {
    const record = await prisma.retrievalCode.findUnique({
      where: { id: codeId },
      include: { donation: { select: { donorId: true, remainingPortions: true, status: true } } },
    })
    if (!record) throw new Error(`SYS_080 — Código ${codeId} não encontrado.`)
    if (record.donation.donorId !== donorId) throw new Error(`AUTH_003 — Ownership inválido.`)
    if (record.status === 'CONFIRMED') throw new CodeAlreadyConfirmedError(codeId)
    if (record.status === 'EXPIRED' || record.expiresAt < new Date()) throw new CodeExpiredError(codeId)

    return retrievalRepository.confirm(codeId)
  }

  /**
   * Registra ausência do doador com grace period de 30min.
   * Código permanece ACTIVE durante o grace period.
   * @see module-10-codigos-historico/TASK-3/ST004
   */
  async handleNoShow(codeId: string, ongUserId: string): Promise<void> {
    const record = await prisma.retrievalCode.findUnique({ where: { id: codeId } })
    if (!record) throw new Error(`SYS_080 — Código ${codeId} não encontrado.`)
    if (record.status !== 'ACTIVE') throw new Error(`SYS_053 — Código não está ativo.`)

    const graceUntil = new Date(Date.now() + 30 * 60 * 1000) // now + 30 min

    // Registrar grace period no código
    // Nota: graceUntil requer migration M010 + prisma generate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.retrievalCode.update({
      where: { id: codeId },
      data: { graceUntil } as never,
    })

    // AuditLog com NO_SHOW
    await prisma.auditLog.create({
      data: {
        action: 'NO_SHOW',
        entityType: 'RetrievalCode',
        entityId: codeId,
        userId: ongUserId,
        metadata: {
          graceUntil: graceUntil.toISOString(),
          incidentType: 'NO_SHOW',
        },
      },
    })
  }

  /**
   * Expira código após fim do grace period (sem confirmação).
   * Chamado pelo cron ou internamente.
   * @see module-10-codigos-historico/TASK-4/ST003
   */
  async handleNoShowExpiry(codeId: string): Promise<void> {
    const record = await prisma.retrievalCode.findUnique({ where: { id: codeId } })
    if (!record) return
    if (record.status !== 'ACTIVE') return // idempotência
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graceUntilField = (record as never as { graceUntil?: Date }).graceUntil
    if (!graceUntilField || graceUntilField > new Date()) return // grace period ainda ativo

    // Expirar como CANCELLED (diferenciado de expiração normal)
    await prisma.$transaction(async (tx) => {
      await tx.retrievalCode.update({
        where: { id: codeId },
        data: { status: 'CANCELLED' },
      })

      // Devolver quantidade ao pool se REGULAR
      const donation = await tx.donation.findUnique({ where: { id: record.donationId }, select: { type: true, remainingPortions: true } })
      if (donation && donation.type !== 'SPONSORED') {
        await tx.donation.update({
          where: { id: record.donationId },
          data: { remainingPortions: { increment: record.portions } },
        })
      }

      await tx.auditLog.create({
        data: {
          action: 'NO_SHOW_EXPIRED',
          entityType: 'RetrievalCode',
          entityId: codeId,
          metadata: { donationId: record.donationId, portions: record.portions },
        },
      })
    })
  }

  /**
   * Expira código por ID com resultado. Idempotente.
   * Usado pelos endpoints internos do cron (module-23).
   * @see module-10-codigos-historico/TASK-4/ST002
   */
  async expireCodeById(codeId: string): Promise<{ expired: boolean; reason: string; quantityReturned?: number }> {
    const record = await prisma.retrievalCode.findUnique({
      where: { id: codeId },
      include: { donation: { select: { type: true, status: true } } },
    })

    if (!record) return { expired: false, reason: 'not_found' }
    if (record.status !== 'ACTIVE') return { expired: false, reason: 'already_resolved' }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.retrievalCode.update({
          where: { id: codeId },
          data: { status: 'EXPIRED' },
        })

        if (record.donation.type !== 'SPONSORED') {
          // REGULAR: devolve quantidade ao pool
          await tx.donation.update({
            where: { id: record.donationId },
            data: { remainingPortions: { increment: record.portions } },
          })
        } else {
          // SPONSORED: restaurar status da doação para AVAILABLE
          await tx.donation.update({
            where: { id: record.donationId },
            data: { status: DonationStatus.AVAILABLE },
          })
        }

        await tx.auditLog.create({
          data: {
            action: 'CODE_EXPIRED',
            entityType: 'RetrievalCode',
            entityId: codeId,
            metadata: {
              donationId: record.donationId,
              codeType: record.donation.type,
              quantityReturned: record.portions,
            },
          },
        })
      })

      return { expired: true, reason: 'expired', quantityReturned: record.portions }
    } catch (err) {
      console.error(`[expireCodeById] Erro ao expirar codeId=${codeId}:`, err)
      return { expired: false, reason: 'error' }
    }
  }

  /**
   * Gera código de retirada para refeição patrocinada com enforcement de horário.
   * Verifica se marmitaria está dentro do horário cadastrado antes de gerar código.
   * @see intake-review/TASK-9/ST002
   */
  async generateSponsoredRetrievalCode(
    matching: MatchingInput,
    receptorId: string | null,
    marmitariaUserId: string
  ): Promise<RetrievalCode> {
    // Buscar schedule da marmitaria
    const marmitariaProfile = await prisma.marmitariaProfile.findUnique({
      where: { userId: marmitariaUserId },
      select: { schedule: true },
    })

    if (marmitariaProfile?.schedule) {
      this._enforceSchedule(marmitariaProfile.schedule as Record<string, { open: string; close: string }>)
    }

    return this.generateRetrievalCode(matching, receptorId, 'INDIVIDUAL')
  }

  /**
   * Valida se a hora atual está dentro do horário de funcionamento.
   * Schedule formato: { "1": { open: "10:00", close: "15:00" }, ... } (0=Dom, 6=Sáb)
   * @throws MarmitariaOutsideHoursError se fora do horário ou dia fechado
   */
  private _enforceSchedule(schedule: Record<string, { open: string; close: string }>): void {
    // Hora atual em timezone America/Sao_Paulo
    const nowBRT = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    )
    const dayOfWeek = nowBRT.getDay().toString() // 0=Sun ... 6=Sat
    const currentHHMM = `${String(nowBRT.getHours()).padStart(2, '0')}:${String(nowBRT.getMinutes()).padStart(2, '0')}`

    const daySchedule = schedule[dayOfWeek]
    if (!daySchedule) {
      throw new MarmitariaOutsideHoursError(
        'Marmitaria não funciona neste dia.',
        'CLOSED_TODAY'
      )
    }

    const { open, close } = daySchedule
    if (currentHHMM < open || currentHHMM > close) {
      throw new MarmitariaOutsideHoursError(
        `Marmitaria fora do horário de funcionamento. Horário hoje: ${open} - ${close}`,
        'OUTSIDE_HOURS'
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  /**
   * Gera código único dentro de uma transação Prisma.
   * Formato: D{dd}{tipo}{XXXX}
   *   dd   = dia do mês zero-padded (01–31)
   *   tipo = "in" (individual) | "f{N}" (família, onde N = groupSize)
   *   XXXX = 4 chars alfanuméricos maiúsculos aleatórios (A-Z0-9)
   * Ex: D05inA3K7, D12f3B2M9
   * Backward compat: regex de validação aceita formato antigo D{d}{I|F}{0000}
   */
  private async _generateCodeTx(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    type: 'INDIVIDUAL' | 'FAMILY',
    groupSize?: number
  ): Promise<string> {
    const dd = String(new Date().getDate()).padStart(2, '0')
    const tipoStr = type === 'FAMILY' ? `f${groupSize ?? 2}` : 'in'
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const maxRetries = 5

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // 4 caracteres alfanuméricos maiúsculos aleatórios
      let suffix = ''
      for (let i = 0; i < 4; i++) {
        suffix += charset[Math.floor(Math.random() * charset.length)]
      }
      const code = `D${dd}${tipoStr}${suffix}`
      const existing = await tx.retrievalCode.findUnique({ where: { code } })
      if (!existing) return code
    }

    throw new Error('SYS_001 — Colisão de código após 5 tentativas.')
  }
}

export const retrievalService = new RetrievalService()
