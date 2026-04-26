/**
 * GET /api/v1/admin/reports
 * Lista denúncias (AuditLog com action IN [REPORT, NO_SHOW]) com paginação e filtros.
 * Query: ?page=1&limit=20&type=REPORT&status=PENDING
 * @see intake-review/TASK-8/ST004
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'

export const GET = withAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const typeFilter = searchParams.get('type') ?? undefined
  const skip = (page - 1) * limit

  // Filtrar por tipos de denúncia/abuso relevantes para a UI
  const allowedActions = typeFilter
    ? [typeFilter]
    : ['ABUSE', 'NO_SHOW', 'REPORT']

  const where = {
    action: { in: allowedActions },
  }

  const [reports, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  // Formatar resposta — mascarar IP (LGPD)
  const formatted = reports.map((r) => ({
    id: r.id,
    type: r.action,
    reportedUser: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email } : null,
    metadata: r.metadata,
    ipAddress: r.ipAddress ? maskIp(r.ipAddress) : null,
    createdAt: r.createdAt,
    status: 'PENDING', // Status derivado — sem campo dedicado no AuditLog
  }))

  return NextResponse.json({
    reports: formatted,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

function maskIp(ip: string): string {
  const parts = ip.split('.')
  if (parts.length === 4) return `xxx.xxx.xxx.${parts[3]}`
  return 'xxx.xxx.xxx.xxx'
}
