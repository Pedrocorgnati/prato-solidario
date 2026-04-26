'use client'
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

/**
 * Client Component — Feedback pós-OAuth do MercadoPago.
 * Exibe loading + redirect para sucesso, ou mensagem de erro.
 *
 * TASK-4/ST002 | US-MP-001 | SCREENS-TASK-4
 */
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_002: 'O link expirou. Inicie a conexão novamente.',
  SYS_003: 'Erro ao conectar com o Mercado Pago. Tente em alguns minutos.',
  cancelled: 'Conexão cancelada. Você pode tentar novamente quando quiser.',
  default: 'Ocorreu um erro inesperado. Tente novamente.',
}

export default function MPCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success: toastSuccess } = useToast()

  const connected = searchParams.get('connected')
  const errorCode = searchParams.get('error')

  useEffect(() => {
    if (connected === 'true') {
      const timer = setTimeout(() => {
        toastSuccess('Mercado Pago conectado com sucesso!')
        router.replace('/marmitaria/integracoes/mercadopago')
      }, 1000)
      return () => clearTimeout(timer)
    }

    // Acesso direto sem parâmetros — redireciona
    if (!connected && !errorCode) {
      const timer = setTimeout(() => {
        router.replace('/marmitaria/integracoes/mercadopago')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [connected, errorCode, router, toastSuccess])

  // Estado: carregando (conexão bem-sucedida, redirect em 1s)
  if (connected === 'true') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Finalizando conexão...</p>
      </div>
    )
  }

  // Estado: sem parâmetros — redirect silencioso
  if (!errorCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    )
  }

  // Estado: erro
  const errorMessage = ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.default

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <Alert variant="destructive" role="alert" aria-live="polite">
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
      <Button
        className="w-full"
        onClick={() => router.push('/marmitaria/integracoes/mercadopago')}
      >
        Voltar para Integrações
      </Button>
    </div>
  )
}
