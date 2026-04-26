'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'
import { generateDataExport } from '@/services/lgpd.service'
import { auditLogRepository } from '@/repositories/audit-log.repository'

export async function requestDataExportAction(): Promise<{
  success: boolean
  error?: string
  requestId?: string
}> {
  const session = await getServerSession()
  if (!session) return { success: false, error: 'Sessão expirada.' }

  // Idempotência: bloquear se já há solicitação ativa
  const pending = await prisma.dataExportRequest.findFirst({
    where: { userId: session.id, status: { in: ['PENDING', 'PROCESSING'] } },
  })
  if (pending) {
    return { success: false, error: 'Já há uma exportação em andamento.' }
  }

  // Criar solicitação
  const request = await prisma.dataExportRequest.create({
    data: { userId: session.id, status: 'PENDING' },
  })

  await auditLogRepository.log('DATA_EXPORT_REQUESTED', 'DataExportRequest', {
    userId: session.id,
    entityId: request.id,
  })

  // Processamento síncrono (MVP — cron assíncrono no module-23)
  try {
    await prisma.dataExportRequest.update({
      where: { id: request.id },
      data: { status: 'PROCESSING' },
    })

    const result = await generateDataExport(session.id, request.id)

    await prisma.dataExportRequest.update({
      where: { id: request.id },
      data: {
        status: 'READY',
        fileUrl: result.signedUrl,
        completedAt: new Date(),
      },
    })
  } catch (err) {
    await prisma.dataExportRequest.update({
      where: { id: request.id },
      data: { status: 'FAILED', completedAt: new Date() },
    })
    await auditLogRepository.log('DATA_EXPORT_FAILED', 'DataExportRequest', {
      userId: session.id,
      entityId: request.id,
      metadata: { error: String(err) },
    })
    return { success: false, error: 'Falha ao gerar exportação. Tente novamente.' }
  }

  revalidatePath('/conta/exportar-dados')
  return { success: true, requestId: request.id }
}
