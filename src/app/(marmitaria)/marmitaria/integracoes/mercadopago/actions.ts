'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * Server Action — desconecta a conta MercadoPago da marmitaria.
 * Remove a MPConnection do banco e revalida a página de integração.
 *
 * TASK-4/ST003 | US-MP-003 | INT-117
 */
export async function disconnectMPAction(): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession()

  if (!session) {
    return { success: false, error: 'AUTH_001' }
  }

  if (session.role !== 'MARMITARIA') {
    return { success: false, error: 'AUTH_003' }
  }

  try {
    // Busca o perfil da marmitaria
    const profile = await prisma.marmitariaProfile.findUnique({
      where: { userId: session.id },
      select: { id: true },
    })

    if (!profile) {
      return { success: false, error: 'SYS_001' }
    }

    // Remove a conexão MP
    await prisma.mPConnection.delete({
      where: { marmitariaId: profile.id },
    })

    revalidatePath('/marmitaria/integracoes/mercadopago')
    return { success: true }
  } catch (err) {
    console.error('[MP Disconnect] Falha ao desconectar:', {
      userId: session.id,
      error: String(err),
    })
    return { success: false, error: 'SYS_001' }
  }
}
