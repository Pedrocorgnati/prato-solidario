import { prisma } from '@/lib/prisma'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import { ConsentVersion, DonationStatus } from '@prisma/client'
import type { ConsentLog, DataExportRequest, User, Address } from '@prisma/client'
import {
  CURRENT_TERMS_VERSION,
  type LGPDServiceResult,
  type AnonymizationResult,
  type DataExportStatus,
} from '@/types/lgpd.types'
import { createHash } from 'crypto'

export { ConsentVersion, CURRENT_TERMS_VERSION }

// ---------------------------------------------------------------------------
// TASK-3/ST001 — ConsentLog
// ---------------------------------------------------------------------------

/**
 * Registra aceite de termos. ConsentLog é imutável.
 */
export async function recordConsent(
  userId: string,
  version: ConsentVersion,
  ipAddress?: string,
  userAgent?: string
): Promise<ConsentLog> {
  const record = await prisma.consentLog.create({
    data: {
      userId,
      version,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    },
  })

  await auditLogRepository.log('CONSENT_UPDATED', 'ConsentLog', {
    userId,
    entityId: record.id,
    metadata: { version },
    ipAddress,
  })

  return record
}

/**
 * Retorna histórico de consentimentos do usuário (DESC por data).
 */
export async function getUserConsents(userId: string): Promise<ConsentLog[]> {
  return prisma.consentLog.findMany({
    where: { userId },
    orderBy: { acceptedAt: 'desc' },
  })
}

/**
 * Verifica se o usuário precisa aceitar uma nova versão dos termos.
 */
export async function needsNewConsent(userId: string): Promise<boolean> {
  const latest = await prisma.consentLog.findFirst({
    where: { userId },
    orderBy: { acceptedAt: 'desc' },
  })

  if (!latest) return true

  const versionOrder: ConsentVersion[] = [ConsentVersion.V1, ConsentVersion.V2]
  const currentIdx = versionOrder.indexOf(CURRENT_TERMS_VERSION)
  const latestIdx = versionOrder.indexOf(latest.version)

  return latestIdx < currentIdx
}

// ---------------------------------------------------------------------------
// TASK-4/ST003 — Exportação de dados
// ---------------------------------------------------------------------------

export interface DataExportResult {
  signedUrl: string
  expiresAt: Date
  sizeBytes: number
}

/**
 * Coleta todos os dados do usuário e gera arquivo JSON para download.
 * URL assinada com validade de 7 dias.
 */
export async function generateDataExport(
  userId: string,
  requestId: string
): Promise<DataExportResult> {
  // 1. Coletar dados
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true,
      restaurantProfile: { select: { tradeName: true, cnpj: true } },
      donorProfile: true,
    },
  })

  if (!user) throw new Error('Usuário não encontrado')

  const donations = await prisma.donation.findMany({
    where: { donorId: userId },
    select: {
      id: true,
      createdAt: true,
      status: true,
      type: true,
    },
  })

  const consents = await prisma.consentLog.findMany({
    where: { userId },
    orderBy: { acceptedAt: 'desc' },
  })

  const auditLogs = await prisma.auditLog.findMany({
    where: { userId },
    select: { action: true, entityType: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  // 2. Serializar (mascarar IP nos consentimentos)
  const exportData = {
    exportedAt: new Date().toISOString(),
    userId,
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      photoUrl: user.photoUrl,
      restaurantProfile: user.restaurantProfile ?? null,
    },
    addresses: user.addresses.map((a: Address) => ({
      cep: a.cep,
      logradouro: a.logradouro,
      numero: a.numero,
      complemento: a.complemento,
      bairro: a.bairro,
      cidade: a.cidade,
      estado: a.estado,
    })),
    donations: donations.map((d) => ({
      id: d.id,
      createdAt: d.createdAt,
      status: d.status,
      type: d.type,
      recipientInfo: 'receptor anônimo',
    })),
    consents: consents.map((c: ConsentLog) => ({
      version: c.version,
      acceptedAt: c.acceptedAt,
      ipAddress: c.ipAddress
        ? c.ipAddress.replace(/\.\d+$/, '.XXX')
        : null,
    })),
    auditLogs: auditLogs.map((l) => ({
      action: l.action,
      entityType: l.entityType,
      createdAt: l.createdAt,
    })),
  }

  // 3. Upload para Supabase Storage bucket lgpd-exports
  const json = JSON.stringify(exportData, null, 2)
  const buffer = Buffer.from(json, 'utf-8')
  const path = `${userId}/${requestId}.json`

  const supabase = await createSupabaseAdminClient()
  const { error: uploadError } = await supabase.storage
    .from('lgpd-exports')
    .upload(path, buffer, {
      contentType: 'application/json',
      upsert: true,
    })

  if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`)

  // 4. Gerar URL assinada (7 dias)
  const SEVEN_DAYS = 7 * 24 * 60 * 60
  const { data: signData, error: signError } = await supabase.storage
    .from('lgpd-exports')
    .createSignedUrl(path, SEVEN_DAYS)

  if (signError || !signData) throw new Error(`Falha ao gerar URL assinada: ${signError?.message}`)

  return {
    signedUrl: signData.signedUrl,
    expiresAt: new Date(Date.now() + SEVEN_DAYS * 1000),
    sizeBytes: buffer.byteLength,
  }
}

// ---------------------------------------------------------------------------
// TASK-5/ST002 — Soft delete
// ---------------------------------------------------------------------------

/**
 * Realiza soft delete imediato + agenda anonimização em 30 dias.
 * Revoga sessão Supabase.
 */
export async function softDeleteAccount(userId: string): Promise<LGPDServiceResult> {
  // Verificar doações ativas
  const activeDonations = await prisma.donation.count({
    where: { donorId: userId, status: { in: [DonationStatus.AVAILABLE, DonationStatus.RESERVED] } },
  })

  if (activeDonations > 0) {
    return {
      success: false,
      error: 'Você tem doações ativas. Aguarde a conclusão ou cancele as doações antes de excluir a conta.',
      errorCode: 'USER_083',
    }
  }

  const now = new Date()
  const scheduledAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await prisma.$transaction(async (tx) => {
    // Soft delete imediato
    await tx.user.update({
      where: { id: userId },
      data: { isActive: false, deletedAt: now },
    })

    // Cancelar DataExportRequests pendentes
    await tx.dataExportRequest.updateMany({
      where: { userId, status: { in: ['PENDING', 'PROCESSING'] } },
      data: { status: 'EXPIRED', completedAt: now },
    })
  })

  await auditLogRepository.log('ACCOUNT_DELETION_REQUESTED', 'User', {
    userId,
    entityId: userId,
    metadata: { scheduledAnonymizationAt: scheduledAt.toISOString() },
  })

  // Revogar sessão Supabase
  const supabase = await createSupabaseAdminClient()
  await supabase.auth.admin.deleteUser(userId).catch(() => {
    // Se falhar, conta já está marcada como inativa — aceitável
  })

  return { success: true }
}

// ---------------------------------------------------------------------------
// TASK-5/ST003 — Anonimização
// ---------------------------------------------------------------------------

/**
 * Anonimiza dados pessoais do usuário. Idempotente (skip se já anonimizado).
 * Chamável pelo cron module-23 (lgpd-cleanup).
 */
export async function anonymizeUser(userId: string): Promise<AnonymizationResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Usuário não encontrado')

  // Idempotência: se já anonimizado, skip
  if (user.name === 'Usuário Anônimo') {
    return { success: true, anonymizedAt: user.deletedAt ?? new Date(), affectedRecords: 0 }
  }

  const anonymizedEmail = `anonimo-${createHash('sha256').update(userId).digest('hex').slice(0, 8)}@deleted.pratosolidario.com.br`
  const now = new Date()

  let affectedRecords = 0

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        name: 'Usuário Anônimo',
        email: anonymizedEmail,
        phone: null,
        document: null,
        photoUrl: null,
        anonymizedAt: now,
      },
    })
    affectedRecords += 1
  })

  // Deletar foto do Storage (sem falhar se não existir)
  if (user.photoUrl) {
    const supabase = await createSupabaseAdminClient()
    const path = user.photoUrl.split('/').slice(-2).join('/')
    await supabase.storage.from('avatars').remove([path]).catch(() => {})
  }

  await auditLogRepository.log('USER_ANONYMIZED', 'User', {
    userId,
    entityId: userId,
    metadata: { affectedRecords, anonymizedAt: now.toISOString() },
  })

  return { success: true, anonymizedAt: now, affectedRecords }
}
