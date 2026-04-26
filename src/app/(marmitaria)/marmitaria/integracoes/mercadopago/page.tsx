export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Link2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { getServerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { DisconnectMPButton } from '@/components/marmitaria/disconnect-mp-button'

export const metadata: Metadata = {
  title: 'Integração Mercado Pago | Prato Solidário',
  description: 'Gerencie a conexão com sua conta do Mercado Pago para receber pagamentos de patrocínio.',
}

/**
 * Server Component — Página principal de integração MercadoPago.
 * Renderiza 3 estados: não conectada | CONNECTED | NEEDS_RECONNECT.
 *
 * TASK-4/ST001 | US-MP-001, US-MP-002 | VISUAL-TASK-4
 */
async function MPContent({ userId }: { userId: string }) {
  const profile = await prisma.marmitariaProfile.findUnique({
    where: { userId },
    select: { id: true },
  })

  const connection = profile
    ? await prisma.mPConnection.findUnique({
        where: { marmitariaId: profile.id },
        select: { mpUserId: true, expiresAt: true, status: true },
      })
    : null

  const status = connection?.status ?? null

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      {/* Estado A — Não conectada */}
      {!connection && (
        <>
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Link2 className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Conecte sua conta do Mercado Pago
            </h2>
            <p className="text-sm text-muted-foreground">
              Receba pagamentos de patrocínio diretamente na sua conta, sem intermediação.
            </p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href="/api/v1/auth/mercadopago/authorize">
              <Link2 className="mr-2 h-5 w-5" />
              Conectar Mercado Pago
            </a>
          </Button>
        </>
      )}

      {/* Estado B — Conectada (CONNECTED) */}
      {status === 'CONNECTED' && connection && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Mercado Pago
                </h2>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-transparent">
              Conectado ✓
            </Badge>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground border-t pt-4">
            <p>
              <span className="font-medium text-foreground">Conta vinculada:</span>{' '}
              #{connection.mpUserId}
            </p>
            {connection.expiresAt && (
              <p>
                <span className="font-medium text-foreground">Válida até:</span>{' '}
                {new Date(connection.expiresAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <div className="pt-2">
            <DisconnectMPButton />
          </div>
        </>
      )}

      {/* Estado C — Needs Reconnect */}
      {status === 'NEEDS_RECONNECT' && (
        <>
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Link2 className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <Alert variant="destructive" role="alert">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Conexão expirada</AlertTitle>
            <AlertDescription>
              Sua conexão com o Mercado Pago expirou. Reconecte para continuar
              recebendo pagamentos de patrocínio.
            </AlertDescription>
          </Alert>
          <Button asChild size="lg" variant="default" className="w-full sm:w-auto">
            <a href="/api/v1/auth/mercadopago/authorize">
              <Link2 className="mr-2 h-5 w-5" />
              Reconectar Mercado Pago
            </a>
          </Button>
        </>
      )}
    </div>
  )
}

export default async function MercadoPagoIntegracaoPage() {
  const session = await getServerSession()

  if (!session || session.role !== 'MARMITARIA') {
    redirect('/entrar')
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Integração Mercado Pago
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie a conexão com sua conta do Mercado Pago
        </p>
      </div>

      <Suspense fallback={<div className="rounded-lg border bg-card p-6 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}>
        <MPContent userId={session!.id} />
      </Suspense>

      {/* Info Card — renderizado em todos os estados */}
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Como funciona?</p>
        <p>
          Ao conectar, os patrocinadores pagam diretamente na sua conta do Mercado
          Pago. A plataforma não retém nenhum valor.
        </p>
      </div>
    </div>
  )
}
