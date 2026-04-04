'use server'

export async function requestCode(_data: { donationId: string; servings: number }) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function listActiveCodes() {
  // TODO: Implementar backend
  return { data: [], total: 0 }
}

export async function listAllCodes(_params?: { page?: number }) {
  // TODO: Implementar backend
  return { data: [], total: 0 }
}

export async function reportAbsence(_codeId: string, _reason?: string) {
  throw new Error('Not implemented - run /auto-flow execute')
}
