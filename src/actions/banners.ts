'use server'

export async function listBanners(_params?: { active?: boolean }) {
  // TODO: Implementar backend
  return { data: [], total: 0 }
}

export async function createBanner(_data: {
  imageUrl: string
  linkUrl?: string
  sponsorId: string
  startDate: string
  endDate: string
}) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function updateBanner(_id: string, _data: Record<string, unknown>) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function deleteBanner(_id: string) {
  throw new Error('Not implemented - run /auto-flow execute')
}
