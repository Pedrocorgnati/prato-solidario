'use server'

import { getServerSession } from '@/lib/auth/session'
import { softDeleteAccount } from '@/services/lgpd.service'

export async function deleteAccountAction(): Promise<{
  success: boolean
  error?: string
  errorCode?: string
}> {
  const session = await getServerSession()
  if (!session) return { success: false, error: 'Sessão expirada.', errorCode: 'AUTH_001' }

  return softDeleteAccount(session.id)
}
