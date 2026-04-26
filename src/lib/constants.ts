// Enums re-exportados de types/enums.ts (fonte canônica: Prisma schema)
// NUNCA redefinir enums localmente — usar sempre os valores do Prisma
export {
  UserRole,
  DonationStatus,
  RetrievalCodeStatus,
  MarmitariaStatus,
  BannerStatus,
} from '@/types/enums'

export const ROUTES = {
  // Público
  HOME: '/',
  COMO_FUNCIONA: '/como-funciona',
  TERMOS: '/termos',
  PRIVACIDADE: '/privacidade',
  HALL_DA_FAMA: '/hall-da-fama',

  // Auth
  ENTRAR: '/entrar',
  LOGIN: '/login',
  CADASTRO_DOADOR: '/cadastro/doador',
  CADASTRO_RESTAURANTE: '/cadastro/restaurante',
  CADASTRO_MARMITARIA: '/cadastro/marmitaria',
  CADASTRO_ONG: '/cadastro/ong',
  CADASTRO_RECEPTOR: '/cadastro/receptor',
  CADASTRO_PATROCINADOR: '/cadastro/patrocinador',
  VERIFICAR_EMAIL: '/verificar-email',
  RECUPERAR_SENHA: '/recuperar-senha',

  // Receptor
  RETIRAR: '/retirar',
  RETIRAR_CODIGO: '/retirar/codigo',
  RETIRAR_REPORTAR: '/retirar/reportar',
  MEUS_CODIGOS: '/meus-codigos',

  // Doador
  DOADOR: '/doador',
  DOADOR_NOVA: '/doador/nova',
  DOADOR_SOBROU: '/doador/sobrou',
  DOADOR_CODIGOS: '/doador/codigos',
  DOADOR_IMPACTO: '/doador/impacto',
  DOADOR_HISTORICO: '/doador/historico',
  DOADOR_PERFIL: '/doador/perfil',
  DOADOR_BANNERS: '/doador/banners',
  DOADOR_CAMPANHAS: '/doador/campanhas',
  DOADOR_CONQUISTAS: '/doador/conquistas',

  // Marmitaria
  MARMITARIA: '/marmitaria',
  MARMITARIA_ENTREGAS: '/marmitaria/entregas',
  MARMITARIA_SALDO: '/marmitaria/saldo',
  MARMITARIA_CODIGOS: '/marmitaria/codigos',
  MARMITARIA_PAGAMENTOS: '/marmitaria/pagamentos',
  MARMITARIA_CONFIG: '/marmitaria/config',
  MARMITARIA_MP_CONNECT: '/marmitaria/integracoes/mercadopago',
  MARMITARIA_AGUARDANDO: '/marmitaria/aguardando',
  MARMITARIA_REJEITADA: '/marmitaria/rejeitada',
  MARMITARIA_SUSPENSA: '/marmitaria/suspensa',

  // Patrocínio
  PATROCINAR: '/patrocinar',
  PATROCINAR_CHECKOUT: '/patrocinar/checkout',
  PATROCINAR_SUCESSO: '/patrocinar/sucesso',
  PATROCINAR_FALHA: '/patrocinar/falha',
  PATROCINAR_PENDENTE: '/patrocinar/pendente',
  PATROCINAR_HISTORICO: '/patrocinar/historico',

  // Admin
  ADMIN: '/admin',
  ADMIN_USUARIOS: '/admin/usuarios',
  ADMIN_BANNERS: '/admin/banners',
  ADMIN_PARCEIROS: '/admin/parceiros',
  ADMIN_DENUNCIAS: '/admin/denuncias',
  ADMIN_MARMITARIAS: '/admin/marmitarias',
  ADMIN_INCIDENTES: '/admin/incidentes',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_MARMITAS_ACUMULADAS: '/admin/marmitas-acumuladas',
} as const

/**
 * Configurações do algoritmo de matching de retiradas.
 * @see module-9-retirada-publica/TASK-2/ST004
 */
export const MATCHING_CONFIG = {
  DEFAULT_RADIUS_KM: 5,      // 5km — INT-029
  MAX_RADIUS_KM: 20,         // 20km — limite máximo para GET disponíveis
  MAX_ACTIVE_CODES_ANONYMOUS: 1, // receptor sem cadastro — INT-062
  PRIORITY_SCORES: {
    INDIVIDUAL: 1.0,
    FAMILY: 1.5,    // quantidade > 2 pessoas
    ONG: 0.8,
    RESTAURANT: 0.8,
  },
  FAMILY_MIN_QUANTITY: 2,    // quantidade > 2 = família
  RATE_LIMIT_AVAILABLE: 30,  // req/min em GET /donations/available — ARCH-007
  CODE_EXPIRY_RETRY_MAX: 3,  // tentativas anti-colisão na geração do código
} as const
