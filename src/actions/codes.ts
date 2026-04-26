'use server'

/**
 * Server Actions para códigos de retirada (doador).
 * @see module-10-codigos-historico/TASK-5/ST003
 */

import { revalidatePath } from 'next/cache'
import { requireRole, requireSession } from '@/lib/auth/session'
import { retrievalRepository } from '@/repositories/retrieval.repository'
import { retrievalService } from '@/services/retrieval.service'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/common'

// ---------------------------------------------------------------------------
// listActiveCodes — Lista códigos ativos das doações do doador autenticado
// ---------------------------------------------------------------------------

export async function listActiveCodes() {
  const session = await requireSession()

  try {
    const codes = await retrievalRepository.getActiveCodesByDonorId(session.id)
    return { data: codes, total: codes.length }
  } catch (err) {
    console.error('[listActiveCodes]', err)
    return { data: [], total: 0 }
  }
}

// ---------------------------------------------------------------------------
// listAllCodes — Lista todos os códigos ativos do doador (sem paginação)
// Nota: o repositório atual não possui histórico paginado por doador.
// ---------------------------------------------------------------------------

export async function listAllCodes(_params?: { page?: number }) {
  const session = await requireSession()

  try {
    const codes = await retrievalRepository.getActiveCodesByDonorId(session.id)
    return { data: codes, total: codes.length }
  } catch (err) {
    console.error('[listAllCodes]', err)
    return { data: [], total: 0 }
  }
}

// ---------------------------------------------------------------------------
// confirmCode — Confirma retirada de um código
// @see module-10-codigos-historico/TASK-5/ST002
// ---------------------------------------------------------------------------

export async function confirmCode(codeId: string): Promise<ActionResponse<{ confirmed: boolean }>> {
  const session = await requireRole(['DOADOR_PF', 'DOADOR_RESTAURANTE'])

  try {
    await retrievalService.confirmCodeById(codeId, session.id)

    revalidatePath('/doador/codigos')
    revalidatePath('/doador/historico')
    return { data: { confirmed: true }, error: null, status: 200 }
  } catch (err) {
    const message = err instanceof Error ? err.message : ''

    if (message.includes('SYS_050') || message.includes('CONFIRMED')) {
      return { data: null, error: 'Este código já foi confirmado.', status: 409 }
    }
    if (message.includes('SYS_051') || message.includes('expirado')) {
      return { data: null, error: 'Este código expirou.', status: 422 }
    }
    if (message.includes('AUTH_003') || message.includes('Ownership')) {
      return { data: null, error: 'Você não tem permissão para confirmar este código.', status: 403 }
    }
    if (message.includes('SYS_080') || message.includes('não encontrado')) {
      return { data: null, error: 'Código não encontrado.', status: 404 }
    }

    console.error('[confirmCode]', err)
    return { data: null, error: 'Erro ao confirmar código. Tente novamente.', status: 500 }
  }
}

// ---------------------------------------------------------------------------
// reportCode — Reporta um problema com um código de retirada
// @see module-10-codigos-historico/TASK-5/ST002
// ---------------------------------------------------------------------------

export async function reportCode(
  codeId: string,
  description: string
): Promise<ActionResponse<{ reported: boolean }>> {
  const session = await requireRole(['DOADOR_PF', 'DOADOR_RESTAURANTE'])

  if (!description || description.trim().length < 10) {
    return {
      data: null,
      error: 'Descrição deve ter ao menos 10 caracteres.',
      status: 400,
    }
  }

  try {
    // Verificar ownership antes de registrar o report
    const record = await retrievalRepository.findByIdWithDonation(codeId)
    if (!record) {
      return { data: null, error: 'Código não encontrado.', status: 404 }
    }
    if (record.donation.donorId !== session.id) {
      return { data: null, error: 'Você não tem permissão para reportar este código.', status: 403 }
    }

    await prisma.auditLog.create({
      data: {
        action: 'CODE_REPORTED',
        entityType: 'RetrievalCode',
        entityId: codeId,
        userId: session.id,
        metadata: {
          description: description.trim(),
          donationId: record.donationId,
          codeStatus: record.status,
        },
      },
    })

    revalidatePath('/doador/codigos')
    return { data: { reported: true }, error: null, status: 200 }
  } catch (err) {
    console.error('[reportCode]', err)
    return { data: null, error: 'Erro ao reportar problema. Tente novamente.', status: 500 }
  }
}

// ---------------------------------------------------------------------------
// requestCode — Solicita código de retirada (receptor)
// Mantido para compatibilidade com importações existentes
// ---------------------------------------------------------------------------

export async function requestCode(_data: { donationId: string; servings: number }) {
  throw new Error('Not implemented - use POST /api/v1/codes')
}

// ---------------------------------------------------------------------------
// reportAbsence — Reporta ausência de receptor (legado)
// ---------------------------------------------------------------------------

export async function reportAbsence(_codeId: string, _reason?: string) {
  throw new Error('Not implemented - use reportCode')
}
