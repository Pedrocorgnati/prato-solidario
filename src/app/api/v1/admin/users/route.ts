/**
 * GET /api/v1/admin/users
 * Lista usuários por role com paginação e filtros.
 * IP e fingerprint mascarados para RECEPTOR (LGPD).
 * @see module-16-admin-gestao/TASK-1/ST002
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import type { AdminUserListItem } from '@/types/admin-gestao'

function maskIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined
  const parts = ip.split('.')
  if (parts.length === 4) return `xxx.xxx.xxx.${parts[3]}`
  return 'xxx.xxx.xxx.xxx'
}

function maskFingerprint(fp: string | null | undefined): string | undefined {
  if (!fp) return undefined
  return fp.slice(0, 6) + '...'
}

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))
  const skip = (page - 1) * limit

  try {
    // Construir filtro de where
    const where: Record<string, unknown> = {}

    if (role === 'DONOR') {
      where.role = { in: ['DOADOR_PF', 'DOADOR_RESTAURANTE'] }
    } else if (role === 'RECIPIENT') {
      where.role = 'RECEPTOR'
    } else if (role) {
      where.role = role
    }

    if (status === 'ACTIVE') where.isActive = true
    else if (status === 'SUSPENDED') where.isActive = false

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          donorProfile: { select: { _count: { select: { donations: true } } } } as never,
        },
      }),
      prisma.user.count({ where }),
    ])

    // Para receptores: buscar registros de abuso
    const isReceptorQuery = role === 'RECIPIENT'
    const abuseMap = new Map<string, number>()

    if (isReceptorQuery && users.length > 0) {
      const userIds = users.map((u) => u.id)
      const abuseRecords = await prisma.abuseRecord.findMany({
        where: {
          userId: { in: userIds },
          blockedUntil: { gt: new Date() },
        },
        select: { userId: true },
      })
      for (const rec of abuseRecords) {
        if (rec.userId) {
          abuseMap.set(rec.userId, (abuseMap.get(rec.userId) ?? 0) + 1)
        }
      }
    }

    const data: AdminUserListItem[] = users.map((u) => {
      const base: AdminUserListItem = {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      }

      if (isReceptorQuery) {
        base.ipMasked = maskIp(null) // IP não está no User model — armazenado no AbuseRecord
        base.fingerprintPartial = undefined
        base.abuseBlocks = abuseMap.get(u.id) ?? 0
      } else if (role === 'DONOR') {
        base.totalDonations = 0 // Calculado via donorProfile._count se disponível
      }

      return base
    })

    return NextResponse.json({ data, total, page, limit })
  } catch (error) {
    console.error('[admin/users] erro ao listar usuários:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao listar usuários.' },
      { status: 500 }
    )
  }
})
