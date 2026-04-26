/**
 * GET /api/v1/admin/alerts
 * Lista alertas administrativos (reincidência, denúncias escaladas, etc.)
 * Query params: ?unreadOnly=true&limit=20
 * @see intake-review/TASK-8/ST002
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'

export const GET = withAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

  const where = unreadOnly ? { read: false } : {}

  const [alerts, unreadCount] = await Promise.all([
    prisma.adminAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.adminAlert.count({ where: { read: false } }),
  ])

  return NextResponse.json({ alerts, unreadCount })
})
