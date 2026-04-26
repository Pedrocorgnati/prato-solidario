/**
 * POST /api/v1/admin/incidents/{id}/resolve
 * Marca incidente como RESOLVED e registra AdminAction.
 * @see module-16-admin-gestao/TASK-3/ST004
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import { adminRepository } from '@/repositories/admin.repository'
import { AdminActionType } from '@/types/enums'

const bodySchema = z.object({
  notas: z.string().max(1000).optional(),
})

export const POST = withAdmin<{ id: string }>(async (req, { params, adminId }) => {
  const { id: incidentId } = params

  let body: z.infer<typeof bodySchema> = {}
  try {
    const raw = await req.json().catch(() => ({}))
    body = bodySchema.parse(raw)
  } catch {
    return NextResponse.json(
      { code: 'VAL_001', message: 'Dados inválidos.' },
      { status: 400 }
    )
  }

  try {
    const incident = await prisma.auditLog.findUnique({ where: { id: incidentId } })
    if (!incident) {
      return NextResponse.json(
        { code: 'INCIDENT_001', message: 'Incidente não encontrado.' },
        { status: 404 }
      )
    }

    const prevMeta = incident.metadata as Record<string, unknown> | null
    if (prevMeta?.incidentStatus === 'RESOLVED') {
      return NextResponse.json(
        { code: 'VAL_050', message: 'Incidente já está resolvido.' },
        { status: 422 }
      )
    }

    // Marcar incidente como RESOLVED
    await prisma.auditLog.update({
      where: { id: incidentId },
      data: {
        metadata: {
          ...prevMeta,
          incidentStatus: 'RESOLVED',
          resolvedAt: new Date().toISOString(),
          resolvedBy: adminId,
          resolvedNotes: body.notas,
        },
      },
    })

    // Registrar na timeline
    await adminRepository.createAdminActionWithAudit({
      adminId,
      type: AdminActionType.APPROVE, // RESOLVE não existe no enum — mapeado para APPROVE
      targetId: incidentId,
      targetType: 'Incident',
      reason: body.notas ?? 'Incidente resolvido pelo administrador.',
      metadata: {
        incidentAction: 'RESOLVE_INCIDENT',
        notas: body.notas,
        entityId: incidentId,
      },
    })

    return NextResponse.json({ success: true, incidentStatus: 'RESOLVED' })
  } catch (error) {
    console.error('[admin/incidents/resolve] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao resolver incidente.' },
      { status: 500 }
    )
  }
})
