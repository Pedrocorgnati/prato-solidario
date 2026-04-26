/**
 * Re-exporta todos os enums do Prisma e adiciona enums de UI.
 * Usar este arquivo como fonte única de verdade para enums em módulos.
 * @see module-2-shared-foundations/TASK-1/ST001
 *
 * Nota: ConsentVersion e AdminActionType definidos localmente — pendentes de
 * regeneração do Prisma client após atualização do schema.
 */

// ---------------------------------------------------------------------------
// Re-export de enums disponíveis no Prisma client gerado
// ---------------------------------------------------------------------------
export {
  UserRole,
  DocumentType,
  MarmitariaStatus,
  Platform,
  /**
   * @contract module-17: DonationStatus.COMPLETED → dispara crédito de 1 dia de banner para DOADOR_RESTAURANTE
   * @contract module-13: DonationType.SPONSORED → campo sponsoredMealId adicionado em module-13
   * @contract module-19: DonationStatus.COMPLETED → atualiza métricas de impacto coletivo
   * @contract module-23: cron de expiração lê Donation.windowEnd (findExpiredPending)
   */
  DonationStatus,
  DonationType,
  RetrievalCodeStatus,
  CodeType,
  BlockLevel,
  BannerStatus,
  /**
   * @module module-17: BannerType define o tipo de campanha de banner
   * PAID = campanha paga por patrocinador externo
   * FREE_RESTAURANT = crédito acumulado por doações do restaurante
   * PERMUTA = troca de visibilidade com plataformas solidárias parceiras
   */
  BannerType,
  /**
   * @module module-17: BannerPosition define onde o banner é exibido
   * TOP = topo da página (proporção 16:3)
   * SIDEBAR = barra lateral (proporção 1:3)
   * INLINE = inline no conteúdo (proporção 1:1)
   */
  BannerPosition,
  /**
   * @module module-17: BannerCreditType registra movimento no histórico de crédito
   * EARNED = crédito ganho por doação
   * USED = crédito utilizado em campanha
   * EXPIRED = crédito expirado por cron
   */
  BannerCreditType,
  NotificationType,
  IncidentType,
} from '@prisma/client'

// ---------------------------------------------------------------------------
// Enums locais (pendentes de geração no Prisma client)
// ---------------------------------------------------------------------------

/** Método de pagamento para compras de patrocínio */
export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
}

/** Status de uma compra de patrocínio */
export enum PurchaseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
}

/** Status de uma marmita patrocinada */
export enum SponsoredMealStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  DELIVERED = 'DELIVERED',
}

/** Versão de consentimento LGPD */
export enum ConsentVersion {
  V1 = 'V1',
  V2 = 'V2',
}

/** Tipos de badge do sistema de gamificação (module-20) */
export enum BadgeType {
  PRIMEIRA_DOACAO = 'PRIMEIRA_DOACAO',
  DOADOR_FREQUENTE = 'DOADOR_FREQUENTE',
  HEROI_DO_MES = 'HEROI_DO_MES',
  CENTURIAO = 'CENTURIAO',
  MESTRE = 'MESTRE',
}

/** Tipo de ação administrativa */
export enum AdminActionType {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUSPEND = 'SUSPEND',
  UNBLOCK = 'UNBLOCK',
  WARN = 'WARN',
  DELETE = 'DELETE',
}

// ---------------------------------------------------------------------------
// Enums de UI (não existem no Prisma — apenas no front-end / lógica local)
// ---------------------------------------------------------------------------

/** Tipos de toast para feedback visual ao usuário */
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/** Direção de ordenação em tabelas e listas */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/** Estado de carregamento de componentes assíncronos */
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
