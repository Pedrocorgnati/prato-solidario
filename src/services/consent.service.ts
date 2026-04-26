import { auditLogRepository } from '@/repositories/audit-log.repository'

/**
 * Helper LGPD (legado module-4): registra consentimento via AuditLog.
 *
 * Para consentimento completo com ConsentLog, usar `recordConsent` de
 * `@/services/lgpd.service.ts` (module-6).
 *
 * Base legal: execução de contrato (Art. 7°, V, LGPD).
 * @see module-4-auth-register/TASK-0/ST006
 * @see PRIVACY-ASSESSMENT §2
 */
export async function recordConsent(params: {
  userId: string
  ipAddress?: string
  userAgent?: string
  consentType?: string
}): Promise<void> {
  await auditLogRepository.log('CONSENT_ACCEPTED', 'User', {
    userId: params.userId,
    entityId: params.userId,
    metadata: {
      consentType: params.consentType ?? 'TERMS_AND_PRIVACY',
      version: 'V1',
      userAgent: params.userAgent,
    },
    ipAddress: params.ipAddress,
  })
}
