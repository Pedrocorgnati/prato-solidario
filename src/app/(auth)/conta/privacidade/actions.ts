'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from '@/lib/auth/session'
import { recordConsent, CURRENT_TERMS_VERSION } from '@/services/lgpd.service'
import { headers } from 'next/headers'

export async function acceptNewTermsAction(): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession()
  if (!session) return { success: false, error: 'Sessão expirada.' }

  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? headersList.get('x-real-ip')
    ?? undefined
  const userAgent = headersList.get('user-agent') ?? undefined

  await recordConsent(session.id, CURRENT_TERMS_VERSION, ipAddress, userAgent)

  revalidatePath('/conta/privacidade')
  return { success: true }
}
