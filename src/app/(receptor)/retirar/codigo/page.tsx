import { WithdrawalCodeDisplay } from "@/components/shared/withdrawal-code-display"
import { CodeStatus } from "@/lib/constants"

// RESOLVED: código real via searchParams — lê os parâmetros da URL gerada pelo fluxo de solicitação
// Parâmetros esperados: ?codigo=XXXX&endereco=...&inicio=HH:MM&fim=HH:MM&status=ATIVO
export default function CodigoPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string; endereco?: string; inicio?: string; fim?: string; status?: string }>
}) {
  return (
    <CodigoContent searchParams={searchParams} />
  )
}

async function CodigoContent({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string; endereco?: string; inicio?: string; fim?: string; status?: string }>
}) {
  const params = await searchParams
  const code = params.codigo ?? "----"
  const address = params.endereco ?? "Endereço não informado"
  const windowStart = params.inicio ?? "--:--"
  const windowEnd = params.fim ?? "--:--"
  const status = (params.status as CodeStatus) ?? CodeStatus.ATIVO

  return (
    <div className="mx-auto max-w-sm px-4 pt-8">
      <h1 className="text-xl font-bold text-center text-[var(--color-text-primary)] mb-6">
        Apresente este código ao doador
      </h1>
      <WithdrawalCodeDisplay
        code={code}
        status={status}
        address={address}
        windowStart={windowStart}
        windowEnd={windowEnd}
      />
    </div>
  )
}
