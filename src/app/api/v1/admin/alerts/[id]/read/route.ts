/**
 * PATCH /api/v1/admin/alerts/[id]/read
 * Marca alerta administrativo como lido.
 * @see intake-review/TASK-8/ST002
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'

export const PATCH = withAdmin(async (
  _request: NextRequest,
  context: { params: { id: string } }
) => {
  const { id } = context.params

  const alert = await prisma.adminAlert.findUnique({ where: { id } })
  if (!alert) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Alerta não encontrado.' } },
      { status: 404 }
    )
  }

  const updated = await prisma.adminAlert.update({
    where: { id },
    data: { read: true },
  })

  return NextResponse.json(updated)
})
