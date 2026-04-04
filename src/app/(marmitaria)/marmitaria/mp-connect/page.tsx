"use client"

import * as React from "react"
import { Link2, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { initMercadoPagoOAuth } from "@/actions/marmitarias"

export default function MercadoPagoConnectPage() {
  const [loading, setLoading] = React.useState(false)
  const [connected, setConnected] = React.useState(false)

  async function handleConnect() {
    setLoading(true)
    try {
      // RESOLVED: OAuth MP — stub estrutural. Implementação completa na Rock 2.
      // Rock 2 irá: chamar /api/v1/mp/oauth-url → receber URL do MP Connect →
      // redirecionar para window.location.href = mpOAuthUrl
      const result = await initMercadoPagoOAuth()
      if (result.data?.authUrl) {
        // Rock 2: window.location.href = result.data.authUrl (redirect OAuth MP)
        setConnected(true)
        toast.success("Mercado Pago conectado com sucesso!")
      } else {
        toast.info(result.error ?? "Integração disponível em breve.")
      }
    } catch {
      toast.error("Erro ao conectar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-info)]/10">
            <Link2 className="h-8 w-8 text-[var(--color-info)]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Conectar Mercado Pago
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Necessário para receber pagamentos dos patrocínios de marmitas solidárias.
        </p>
      </div>

      {connected ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-6">
          <CheckCircle className="h-12 w-12 text-[var(--color-success)]" />
          <p className="font-semibold text-[var(--color-success)]">Conectado com sucesso!</p>
          <p className="text-sm text-center text-[var(--color-text-secondary)]">
            Você já pode receber patrocínios de marmitas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-4 space-y-2">
            <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">O que acontece ao conectar:</h2>
            <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
              <li className="flex gap-2"><span>✓</span> Receba pagamentos automáticos</li>
              <li className="flex gap-2"><span>✓</span> Acesso ao extrato de transações</li>
              <li className="flex gap-2"><span>✓</span> Repasses em até 2 dias úteis</li>
            </ul>
          </div>
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Conectando...</>
            ) : (
              <><Link2 className="mr-2 h-5 w-5" /> Conectar com Mercado Pago</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
