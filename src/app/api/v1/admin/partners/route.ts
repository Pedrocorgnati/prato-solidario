/**
 * GET /api/v1/admin/partners
 * Lista parceiros (ONGs e Patrocinadores) com filtros por tipo, status e verificação.
 * @see module-16-admin-gestao/TASK-4/ST002
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import type { AdminPartnerListItem } from '@/types/admin-gestao'

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'ONG' | 'SPONSOR'
  const isActiveStr = searchParams.get('status')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))
  const skip = (page - 1) * limit

  try {
    const data: AdminPartnerListItem[] = []
    let total = 0

    if (!type || type === 'ONG') {
      const whereUser: Record<string, unknown> = { role: 'ONG' }
      if (isActiveStr === 'ACTIVE') whereUser.isActive = true
      else if (isActiveStr === 'SUSPENDED') whereUser.isActive = false

      const [ongs, ongCount] = await Promise.all([
        prisma.user.findMany({
          where: whereUser,
          skip: type ? skip : 0,
          take: type ? limit : Math.ceil(limit / 2),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
            ongProfile: { select: { id: true, cnpj: true } },
          },
        }),
        prisma.user.count({ where: whereUser }),
      ])

      total += ongCount

      for (const ong of ongs) {
        data.push({
          id: ong.ongProfile?.id ?? ong.id,
          userId: ong.id,
          name: ong.name,
          cnpj: ong.ongProfile?.cnpj,
          type: 'ONG',
          isVerified: false, // OngProfile não tem campo isVerified — estado em AdminAction.metadata
          isActive: ong.isActive,
          createdAt: ong.createdAt.toISOString(),
        })
      }
    }

    if (!type || type === 'SPONSOR') {
      const whereUser: Record<string, unknown> = { role: 'PATROCINADOR' }
      if (isActiveStr === 'ACTIVE') whereUser.isActive = true
      else if (isActiveStr === 'SUSPENDED') whereUser.isActive = false

      const [sponsors, sponsorCount] = await Promise.all([
        prisma.user.findMany({
          where: whereUser,
          skip: type ? skip : 0,
          take: type ? limit : Math.floor(limit / 2),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
            sponsorProfile: {
              select: {
                id: true,
                cnpj: true,
                companyName: true,
                purchases: {
                  select: { totalAmount: true },
                  where: { paymentStatus: 'APPROVED' },
                },
              },
            },
          },
        }),
        prisma.user.count({ where: whereUser }),
      ])

      total += sponsorCount

      for (const sponsor of sponsors) {
        const totalPatrocinado = sponsor.sponsorProfile?.purchases?.reduce(
          (sum, p) => sum + Number(p.totalAmount ?? 0),
          0
        ) ?? 0

        data.push({
          id: sponsor.sponsorProfile?.id ?? sponsor.id,
          userId: sponsor.id,
          name: sponsor.sponsorProfile?.companyName ?? sponsor.name,
          cnpj: sponsor.sponsorProfile?.cnpj ?? undefined,
          type: 'SPONSOR',
          isActive: sponsor.isActive,
          totalPatrocinado: Math.round(totalPatrocinado * 100), // centavos
          createdAt: sponsor.createdAt.toISOString(),
        })
      }
    }

    return NextResponse.json({ data, total, page, limit })
  } catch (error) {
    console.error('[admin/partners] erro ao listar parceiros:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao listar parceiros.' },
      { status: 500 }
    )
  }
})
