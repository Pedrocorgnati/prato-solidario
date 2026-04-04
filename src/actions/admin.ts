'use server'

export async function listUsers(_params?: { page?: number; role?: string; search?: string }) {
  // TODO: Implementar backend
  return { data: [], total: 0 }
}

export async function approveUser(_userId: string) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function suspendUser(_userId: string, _reason?: string) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function listIncidents(_params?: { page?: number; status?: string }) {
  // TODO: Implementar backend
  return { data: [], total: 0 }
}

export async function resolveIncident(_incidentId: string, _resolution: string) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function getAdminStats() {
  // TODO: Implementar backend
  return {
    data: {
      totalUsers: 0,
      totalDonations: 0,
      totalMealsDelivered: 0,
      pendingIncidents: 0,
      activeMarmitarias: 0,
    },
    error: null,
  }
}
