/**
 * Tipos compartilhados para o módulo admin-gestao.
 * Fonte única de verdade para listagem e ações administrativas.
 * @see module-16-admin-gestao/TASK-0/ST002
 */

import type { IncidentType, MarmitariaStatus } from '@/types/enums'

// ---------------------------------------------------------------------------
// Usuários (Doadores e Receptores)
// ---------------------------------------------------------------------------

export interface AdminUserListItem {
  id: string
  name: string
  email: string
  role: string
  /** isActive = false → SUSPENDED */
  isActive: boolean
  createdAt: string
  /** Apenas para RECEPTOR: IP mascarado no formato xxx.xxx.xxx.{octet} */
  ipMasked?: string
  /** Apenas para RECEPTOR: fingerprint parcial (max 6 chars + "...") */
  fingerprintPartial?: string
  /** Apenas para RECEPTOR: bloqueios ativos no AbuseService */
  abuseBlocks?: number
  /** Apenas para DOADOR: total de doações */
  totalDonations?: number
}

// ---------------------------------------------------------------------------
// Marmitarias
// ---------------------------------------------------------------------------

export interface AdminMarmitariaListItem {
  id: string
  /** ID do usuário proprietário */
  ownerId: string
  ownerName: string
  ownerEmail: string
  tradeName: string
  cnpj: string
  status: MarmitariaStatus
  createdAt: string
}

// ---------------------------------------------------------------------------
// Incidentes
// ---------------------------------------------------------------------------

export interface AdminIncidentListItem {
  id: string
  type: IncidentType
  /** IP mascarado LGPD: xxx.xxx.xxx.{octet} */
  ipMasked?: string
  involvedUserId?: string
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  createdAt: string
}

export interface AdminIncidentDetail extends AdminIncidentListItem {
  description?: string
  timeline: AdminIncidentTimelineEntry[]
}

export interface AdminIncidentTimelineEntry {
  id: string
  action: string
  adminId: string
  adminName?: string
  notes?: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Parceiros (ONGs e Patrocinadores)
// ---------------------------------------------------------------------------

export interface AdminSponsoredMealAccumulated {
  marmitariaId: string
  marmitariaNome: string
  totalCreditos: number
  creditoMaisAntigoEm: string
  diasAcumulados: number
}

export interface AdminPartnerListItem {
  id: string
  userId: string
  name: string
  cnpj?: string
  type: 'ONG' | 'SPONSOR'
  /** Apenas para ONG */
  isVerified?: boolean
  isActive: boolean
  /** Apenas para ONG: total de retiradas patrocinadas */
  totalRetiradas?: number
  /** Apenas para SPONSOR: total patrocinado em centavos */
  totalPatrocinado?: number
  lastActivityAt?: string
  createdAt: string
}
