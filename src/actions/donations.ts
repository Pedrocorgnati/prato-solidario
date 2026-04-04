'use server'

export async function listDonations(_params?: { page?: number; status?: string; lat?: number; lng?: number }) {
  // TODO: Implementar backend
  return { data: [], total: 0 }
}

export async function createDonation(_data: {
  title: string
  description?: string
  servings: number
  windowStart: string
  windowEnd: string
  address: string
  photos?: string[]
}) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function confirmWithdrawal(_codeId: string) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function closeDonation(_donationId: string) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function getDonationById(_id: string) {
  // TODO: Implementar backend
  return { data: null, error: null }
}
