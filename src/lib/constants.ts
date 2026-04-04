export enum UserRole {
  RECEPTOR = 'RECEPTOR',
  DOADOR = 'DOADOR',
  ONG = 'ONG',
  VOLUNTARIO = 'VOLUNTARIO',
  MARMITARIA = 'MARMITARIA',
  PATROCINADOR = 'PATROCINADOR',
  ADMIN = 'ADMIN',
}

export enum DonationStatus {
  DISPONIVEL = 'DISPONIVEL',
  URGENTE = 'URGENTE',
  ESGOTADA = 'ESGOTADA',
  EXPIRADA = 'EXPIRADA',
}

export enum CodeStatus {
  ATIVO = 'ATIVO',
  CONFIRMADO = 'CONFIRMADO',
  EXPIRADO = 'EXPIRADO',
  CANCELADO = 'CANCELADO',
}

export enum MarmitariaStatus {
  PENDENTE = 'PENDENTE',
  ATIVA = 'ATIVA',
  SUSPENSA = 'SUSPENSA',
  INATIVA = 'INATIVA',
}

export enum BannerStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  AGENDADO = 'AGENDADO',
  EXPIRADO = 'EXPIRADO',
}

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
  DOADOR_CONQUISTAS: '/doador/conquistas',

  // Marmitaria
  MARMITARIA: '/marmitaria',
  MARMITARIA_CODIGOS: '/marmitaria/codigos',
  MARMITARIA_PAGAMENTOS: '/marmitaria/pagamentos',
  MARMITARIA_CONFIG: '/marmitaria/config',
  MARMITARIA_MP_CONNECT: '/marmitaria/mp-connect',

  // Patrocínio
  PATROCINAR: '/patrocinar',
  PATROCINAR_CHECKOUT: '/patrocinar/checkout',
  PATROCINAR_CONFIRMACAO: '/patrocinar/confirmacao',
  PATROCINAR_HISTORICO: '/patrocinar/historico',

  // Admin
  ADMIN: '/admin',
  ADMIN_USUARIOS: '/admin/usuarios',
  ADMIN_BANNERS: '/admin/banners',
  ADMIN_PARCEIROS: '/admin/parceiros',
  ADMIN_DENUNCIAS: '/admin/denuncias',
  ADMIN_MARMITARIAS: '/admin/marmitarias',
  ADMIN_INCIDENTES: '/admin/incidentes',
} as const
