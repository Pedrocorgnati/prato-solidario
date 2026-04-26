/**
 * Notification preferences service — TASK-5 (intake-review).
 *
 * Ressalva de pragmatismo P2:
 *   Evitamos migration no schema para nao quebrar o DB atual. As preferencias
 *   sao persistidas no AuditLog mais recente do usuario com
 *   action='preferences_updated' em metadata.preferences. Enquanto nao houver
 *   migration dedicada, essa e a fonte canonica.
 *
 *   TODO: criar model NotificationPreferences (userId @unique + categories Json)
 *   + migration quando houver janela segura. Ate la, defaults sao aplicados
 *   por merge.
 */
import { prisma } from '@/lib/prisma'

export type NotificationCategory =
  | 'analytics'
  | 'geolocation'
  | 'pushCodeGenerated'
  | 'pushSobrou'
  | 'pushAdmin'
  | 'emailMarketing'

export type NotificationPreferences = Record<NotificationCategory, boolean>

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  analytics: false, // opt-in LGPD
  geolocation: false, // opt-in LGPD
  pushCodeGenerated: true,
  pushSobrou: true,
  pushAdmin: true,
  emailMarketing: false, // opt-in
}

/**
 * Le preferencias do usuario a partir do AuditLog mais recente.
 * Retorna defaults quando nao ha registro.
 */
export async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const last = await prisma.auditLog.findFirst({
    where: { userId, action: 'preferences_updated' },
    orderBy: { createdAt: 'desc' },
  })
  const stored = (last?.metadata as { preferences?: Partial<NotificationPreferences> } | null)
    ?.preferences
  return { ...DEFAULT_PREFERENCES, ...(stored ?? {}) }
}

/**
 * Persiste nova versao das preferencias via AuditLog.
 * Retorna o estado consolidado apos merge com defaults.
 */
export async function updatePreferences(
  userId: string,
  patch: Partial<NotificationPreferences>,
  ipAddress?: string,
): Promise<NotificationPreferences> {
  const current = await getPreferences(userId)
  const next: NotificationPreferences = { ...current, ...patch }

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'preferences_updated',
      entityType: 'user_preferences',
      entityId: userId,
      metadata: {
        preferences: next,
        changed: Object.keys(patch),
      },
      ipAddress: ipAddress ?? null,
    },
  })

  return next
}

/**
 * Gate para callsites de push: retorna false se o usuario optou por nao
 * receber notificacoes da categoria.
 */
export async function canSendPush(
  userId: string,
  category: Extract<
    NotificationCategory,
    'pushCodeGenerated' | 'pushSobrou' | 'pushAdmin'
  >,
): Promise<boolean> {
  const prefs = await getPreferences(userId)
  return prefs[category] !== false
}
