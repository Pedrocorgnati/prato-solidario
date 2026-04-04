'use server'

export async function listSponsorHistory(_params?: { page?: number }) {
  // TODO: Implementar backend
  return { data: [], total: 0 }
}

export async function createSponsorship(_data: {
  marmitariaId: string
  mealsCount: number
  message?: string
}) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function getSponsorshipById(_id: string) {
  // TODO: Implementar backend
  return { data: null, error: null }
}
