import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/lgpd/export?requestId={id}
 * Redireciona para a URL assinada do arquivo de exportação.
 * @see module-6-profile-lgpd/TASK-4/ST004
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const requestId = request.nextUrl.searchParams.get('requestId')
  if (!requestId) {
    return NextResponse.json({ error: 'requestId obrigatório.' }, { status: 400 })
  }

  const exportRequest = await prisma.dataExportRequest.findUnique({
    where: { id: requestId },
  })

  if (!exportRequest || exportRequest.userId !== session.id) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  if (exportRequest.status === 'EXPIRED' || !exportRequest.fileUrl) {
    return NextResponse.json(
      { error: 'Link expirado. Solicite uma nova exportação.' },
      { status: 410 }
    )
  }

  if (exportRequest.status !== 'READY') {
    return NextResponse.json({ error: 'Exportação ainda não está pronta.' }, { status: 409 })
  }

  return NextResponse.redirect(exportRequest.fileUrl)
}
