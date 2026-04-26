'use server'

/**
 * Server Actions de admin — redireciona para implementações reais.
 * Mantido para compatibilidade com imports existentes.
 * @deprecated Use admin-list.actions.ts e admin-users.actions.ts diretamente.
 */

export { listUsersAdmin as listUsers } from './admin-list.actions'
export { listIncidentsAdmin as listIncidents } from './admin-list.actions'
export { suspendUser, reactivateUser } from './admin-users.actions'
export { resolveIncident } from './admin-incidents.actions'

export async function getAdminStats() {
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
