'use server'

export async function listMarmitarias(_params?: { page?: number; lat?: number; lng?: number }) {
  // TODO: Implementar backend
  return { data: [], total: 0 }
}

export async function getMarmitariaById(_id: string) {
  // TODO: Implementar backend
  return { data: null, error: null }
}

export async function createMarmitaria(_data: {
  name: string
  cnpj: string
  address: string
  phone: string
  pricePerMeal: number
}) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function updateMarmitaria(_id: string, _data: Record<string, unknown>) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function connectMercadoPago(_code: string) {
  // Implementado via /api/v1/auth/mercadopago/callback (module-12)
  throw new Error('Use GET /api/v1/auth/mercadopago/callback para processar o OAuth callback')
}

/**
 * Retorna a URL de autorização OAuth do MercadoPago para redirect client-side.
 * @deprecated Usar link direto para /api/v1/auth/mercadopago/authorize (Server Component + <a>)
 */
export async function initMercadoPagoOAuth(): Promise<{ data: { authUrl: string } | null; error: string | null }> {
  return { data: { authUrl: '/api/v1/auth/mercadopago/authorize' }, error: null }
}

// Re-export da Server Action colocada com a página de integração
export { disconnectMPAction } from '@/app/(marmitaria)/marmitaria/integracoes/mercadopago/actions'
