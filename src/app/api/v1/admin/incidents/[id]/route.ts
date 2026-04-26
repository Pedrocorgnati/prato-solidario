/**
 * GET /api/v1/admin/incidents/{id}
 * Retorna detalhes do incidente + timeline (AuditLog relacionado).
 *
 * PATCH /api/v1/admin/incidents/{id}
 * Executa ação intermediária: START_INVESTIGATION, WARN_USER, SUSPEND_USER, UNBLOCK_USER.
 *
 * @see module-16-admin-gestao/TASK-3/ST004
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import { adminRepository } from '@/repositories/admin.repository'
import { AdminActionType } from '@/types/enums'

const PATCH_ACTIONS = ['START_INVESTIGATION', 'WARN_USER', 'SUSPEND_USER', 'UNBLOCK_USER'] as const
type PatchAction = typeof PATCH_ACTIONS[number]

const patchSchema = z.object({
  action: z.enum(PATCH_ACTIONS),
  notas: z.string().max(1000).optional(),
})

function maskIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined
  const parts = ip.split('.')
  if (parts.length === 4) return `xxx.xxx.xxx.${parts[3]}`
  return 'xxx.xxx.xxx.xxx'
}

function actionToAdminActionType(action: PatchAction): AdminActionType {
  switch (action) {
    case 'SUSPEND_USER': return AdminActionType.SUSPEND
    case 'UNBLOCK_USER': return AdminActionType.UNBLOCK
    case 'WARN_USER': return AdminActionType.WARN
    default: return AdminActionType.APPROVE // START_INVESTIGATION → mapped to APPROVE as placeholder
  }
}

function statusFromAction(action: PatchAction): string {
  if (action === 'START_INVESTIGATION') return 'INVESTIGATING'
  return 'INVESTIGATING' // ações sobre usuário não mudam status do incidente
}

export const GET = withAdmin<{ id: string }>(async (_req, { params }) => {
  const { id: incidentId } = params

  try {
    const incident = await prisma.auditLog.findUnique({
      where: { id: incidentId },
      select: {
        id: true,
        action: true,
        ipAddress: true,
        userId: true,
        metadata: true,
        createdAt: true,
      },
    })

    if (!incident) {
      return NextResponse.json(
        { code: 'INCIDENT_001', message: 'Incidente não encontrado.' },
        { status: 404 }
      )
    }

    // Timeline: todos os AuditLogs com entityId = incidentId
    const timeline = await prisma.auditLog.findMany({
      where: { entityType: 'Incident', entityId: incidentId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        action: true,
        userId: true,
        metadata: true,
        createdAt: true,
      },
    })

    const meta = incident.metadata as Record<string, unknown> | null

    return NextResponse.json({
      id: incident.id,
      type: incident.action,
      ipMasked: maskIp(incident.ipAddress),
      involvedUserId: incident.userId,
      status: (meta?.incidentStatus as string) ?? 'OPEN',
      description: (meta?.description as string) ?? undefined,
      createdAt: incident.createdAt.toISOString(),
      timeline: timeline.map((t) => {
        const tm = t.metadata as Record<string, unknown> | null
        return {
          id: t.id,
          action: t.action,
          adminId: t.userId,
          notes: (tm?.notas as string) ?? undefined,
          createdAt: t.createdAt.toISOString(),
        }
      }),
    })
  } catch (error) {
    console.error('[admin/incidents/GET] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao buscar incidente.' },
      { status: 500 }
    )
  }
})

export const PATCH = withAdmin<{ id: string }>(async (req, { params, adminId }) => {
  const { id: incidentId } = params

  let body: z.infer<typeof patchSchema>
  try {
    body = patchSchema.parse(await req.json())
  } catch {
    return NextResponse.json(
      { code: 'VAL_001', message: 'Dados inválidos. action deve ser um dos: ' + PATCH_ACTIONS.join(', ') },
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
    const newStatus = statusFromAction(body.action)

    // Atualizar status do incidente no metadata
    await prisma.auditLog.update({
      where: { id: incidentId },
      data: {
        metadata: { ...prevMeta, incidentStatus: newStatus },
      },
    })

    // Registrar a ação na timeline
    await adminRepository.createAdminActionWithAudit({
      adminId,
      type: actionToAdminActionType(body.action),
      targetId: incidentId,
      targetType: 'Incident',
      reason: body.notas ?? body.action,
      metadata: { incidentAction: body.action, notas: body.notas, entityId: incidentId },
    })

    return NextResponse.json({ success: true, action: body.action, incidentStatus: newStatus })
  } catch (error) {
    console.error('[admin/incidents/PATCH] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao executar ação no incidente.' },
      { status: 500 }
    )
  }
})
