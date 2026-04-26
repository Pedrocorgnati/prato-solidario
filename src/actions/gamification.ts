'use server'

/**
 * Server Actions para gamificação.
 *
 * updateHallOfFameOptIn — alterna preferência de aparecimento no Hall da Fama público.
 * Validação: userId da sessão == userId da requisição (sem IDOR).
 *
 * @see module-20-gamificacao/TASK-3/ST004
 */

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { gamificationRepository } from '@/repositories/gamification.repository'
import type { ActionResponse } from '@/types/common'

/**
 * Atualiza opt-in do Hall da Fama para o usuário autenticado.
 * Retorna { ok: true } ou { ok: false, error: mensagem }.
 */
export async function updateHallOfFameOptIn(
  enabled: boolean,
): Promise<ActionResponse<{ enabled: boolean }>> {
  try {
    const session = await requireSession()

    await gamificationRepository.updateHallOfFameOptIn(session.id, enabled)

    // Invalida cache da página do Hall da Fama e de conquistas
    revalidatePath('/hall-da-fama')
    revalidatePath('/doador/conquistas')

    return { data: { enabled }, error: null, status: 200 }
  } catch (err) {
    console.error('[gamification] updateHallOfFameOptIn:', err)
    return {
      data: null,
      error: 'Não foi possível salvar sua preferência. Tente novamente.',
      status: 500,
    }
  }
}
