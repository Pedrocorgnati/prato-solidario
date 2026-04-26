/**
 * GET /api/v1/admin/incidents
 * Lista incidentes via AuditLog com filtros por tipo, status e período.
 * IP mascarado LGPD. Retorna openCount.
 *
 * POST /api/v1/admin/incidents
 * Criação manual — reservado para uso futuro (501).
 *
 * @see module-16-admin-gestao/TASK-3/ST003
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import { IncidentType } from '@/types/enums'
import type { AdminIncidentListItem } from '@/types/admin-gestao'

function maskIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined
  const parts = ip.split('.')
  if (parts.length === 4) return `xxx.xxx.xxx.${parts[3]}`
  return 'xxx.xxx.xxx.xxx'
}

function severityFromType(type: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (type === IncidentType.FRAUD || type === IncidentType.ABUSE) return 'HIGH'
  if (type === IncidentType.NO_SHOW) return 'MEDIUM'
  return 'LOW'
}

function periodToDate(period: string | null): Date | undefined {
  if (!period) return undefined
  const now = new Date()
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === '7d') {
    const d = new Date(now); d.setDate(d.getDate() - 7); return d
  }
  if (period === '30d') {
    const d = new Date(now); d.setDate(d.getDate() - 30); return d
  }
  return undefined
}

// Incidentes são armazenados no AuditLog com action = IncidentType value
const INCIDENT_ACTIONS = Object.values(IncidentType) as string[]

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const period = searchParams.get('period') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))
  const skip = (page - 1) * limit

  try {
    const since = periodToDate(period ?? null)

    const where: Record<string, unknown> = {
      action: type ? type : { in: INCIDENT_ACTIONS },
    }

    if (since) where.createdAt = { gte: since }

    // Status é armazenado em metadata.incidentStatus
    // Filtragem em memória para status (não indexado no schema)
    const allLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        ipAddress: true,
        userId: true,
        metadata: true,
        createdAt: true,
      },
    })

    // Filtrar por status se fornecido
    const filtered = status
      ? allLogs.filter((l) => {
          const meta = l.metadata as Record<string, unknown> | null
          const s = meta?.incidentStatus ?? 'OPEN'
          return s === status
        })
      : allLogs

    const openCount = allLogs.filter((l) => {
      const meta = l.metadata as Record<string, unknown> | null
      return (meta?.incidentStatus ?? 'OPEN') === 'OPEN'
    }).length

    const paginated = filtered.slice(skip, skip + limit)

    const data: AdminIncidentListItem[] = paginated.map((l) => {
      const meta = l.metadata as Record<string, unknown> | null
      return {
        id: l.id,
        type: l.action as IncidentType,
        ipMasked: maskIp(l.ipAddress),
        involvedUserId: l.userId ?? undefined,
        status: ((meta?.incidentStatus as string) ?? 'OPEN') as AdminIncidentListItem['status'],
        severity: severityFromType(l.action),
        createdAt: l.createdAt.toISOString(),
      }
    })

    return NextResponse.json({ data, total: filtered.length, openCount, page, limit })
  } catch (error) {
    console.error('[admin/incidents] erro ao listar incidentes:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao listar incidentes.' },
      { status: 500 }
    )
  }
})

export const POST = withAdmin(async () => {
  return NextResponse.json(
    { code: 'NOT_IMPLEMENTED', message: 'Criação manual de incidentes reservada para uso futuro.' },
    { status: 501 }
  )
})
