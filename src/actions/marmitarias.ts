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
  throw new Error('Not implemented - run /auto-flow execute')
}

// RESOLVED: stub para OAuth Mercado Pago — Rock 2 preenche a URL real do MP Connect
// Fluxo: initMercadoPagoOAuth() → redirect MP → callback /api/v1/mp/callback → connectMercadoPago(code)
export async function initMercadoPagoOAuth(): Promise<{ data: { authUrl: string } | null; error: string | null }> {
  // TODO (Rock 2): const authUrl = `https://auth.mercadopago.com/authorization?client_id=${process.env.MP_CLIENT_ID}&...`
  return { data: null, error: "Integração Mercado Pago será habilitada em breve." }
}
