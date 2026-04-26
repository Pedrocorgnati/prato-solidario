// Error catalog — Prato Solidário
// Fonte: ERROR-CATALOG.md v1.0

// ---------------------------------------------------------------------------
// VAL — Validação
// ---------------------------------------------------------------------------
export const VAL_001 = { code: 'VAL_001', status: 400, message: 'Campo obrigatório ausente.' }
export const VAL_002 = { code: 'VAL_002', status: 400, message: 'Formato inválido.' }
export const VAL_003 = { code: 'VAL_003', status: 400, message: 'Valor fora do range permitido.' }
export const VAL_004 = { code: 'VAL_004', status: 400, message: 'Tamanho inválido.' }
export const VAL_005 = { code: 'VAL_005', status: 400, message: 'Enum inválido.' }

// ---------------------------------------------------------------------------
// SYS — Sistema
// ---------------------------------------------------------------------------
export const SYS_001 = { code: 'SYS_001', status: 500, message: 'Erro interno. Tente novamente em instantes.' }
export const SYS_002 = { code: 'SYS_002', status: 503, message: 'Serviço temporariamente indisponível.' }
export const SYS_003 = { code: 'SYS_003', status: 500, message: 'Falha ao processar a requisição.' }

// ---------------------------------------------------------------------------
// AUTH — Autenticação e Autorização
// ---------------------------------------------------------------------------
export const AUTH_001 = { code: 'AUTH_INVALID_CREDENTIALS', status: 401, message: 'E-mail ou senha inválidos.' }
export const AUTH_002 = { code: 'AUTH_EMAIL_NOT_VERIFIED', status: 401, message: 'Verifique seu e-mail antes de continuar.' }
export const AUTH_003 = { code: 'AUTH_RATE_LIMITED', status: 429, message: 'Muitas tentativas. Tente novamente em 15 minutos.' }
export const AUTH_004 = { code: 'AUTH_ACCOUNT_SUSPENDED', status: 403, message: 'Conta suspensa. Entre em contato com o suporte.' }
export const AUTH_005 = { code: 'AUTH_EMAIL_EXISTS', status: 409, message: 'Se este e-mail estiver disponível, você pode continuar.' }
export const AUTH_006 = { code: 'AUTH_TOKEN_EXPIRED', status: 401, message: 'Link expirado. Solicite um novo.' }
export const AUTH_007 = { code: 'AUTH_TOKEN_INVALID', status: 401, message: 'Token inválido ou expirado.' }
export const AUTH_008 = { code: 'AUTH_FORBIDDEN', status: 403, message: 'Acesso não autorizado.' }
export const AUTH_009 = { code: 'AUTH_MARMITARIA_PENDING', status: 403, message: 'Cadastro aguardando aprovação.' }

// ---------------------------------------------------------------------------
// RATE — Rate Limiting
// ---------------------------------------------------------------------------
export const RATE_001 = { code: 'RATE_LOGIN', status: 429, message: 'Limite de tentativas de login atingido. Tente em 15 minutos.' }
export const RATE_002 = { code: 'RATE_REGISTER', status: 429, message: 'Limite de cadastros atingido. Tente em 1 hora.' }
export const RATE_003 = { code: 'RATE_PASSWORD_RESET', status: 429, message: 'Limite de redefinições atingido. Tente em 1 hora.' }
export const RATE_004 = { code: 'RATE_PUSH_TOKEN', status: 429, message: 'Limite de registros de token atingido. Tente em 1 minuto.' }
export const RATE_050 = { code: 'RATE_CODE_LIMIT', status: 200, message: 'Você já possui um código ativo. Use-o antes de solicitar outro.' }

// ---------------------------------------------------------------------------
// RETRIEVAL — Códigos de Retirada (module-9)
// ---------------------------------------------------------------------------
export const SYS_050 = { code: 'SYS_CODE_ALREADY_CONFIRMED', status: 409, message: 'Este código já foi confirmado.' }
export const SYS_051 = { code: 'SYS_CODE_EXPIRED', status: 410, message: 'Este código já expirou.' }
export const SYS_080 = { code: 'SYS_DONATION_NOT_FOUND', status: 404, message: 'Doação não encontrada.' }

// ---------------------------------------------------------------------------
// USER — Usuário
// ---------------------------------------------------------------------------
export const USER_001 = { code: 'USER_DOCUMENT_EXISTS', status: 409, message: 'Este documento já está vinculado a outra conta.' }
export const USER_002 = { code: 'USER_EMAIL_EXISTS', status: 409, message: 'E-mail já cadastrado.' }
export const USER_003 = { code: 'USER_INVALID_DOCUMENT', status: 422, message: 'Documento inválido. Verifique os números.' }
export const USER_004 = { code: 'USER_PHOTO_REQUIRED', status: 422, message: 'Foto obrigatória para marmitarias.' }
export const USER_005 = { code: 'USER_PRICE_INVALID', status: 422, message: 'Valor mínimo R$ 0,01.' }
export const USER_006 = { code: 'USER_HAS_ACTIVE_DONATIONS', status: 409, message: 'Aguarde a conclusão das doações ativas antes de solicitar exclusão.' }
export const USER_007 = { code: 'USER_NOT_FOUND', status: 404, message: 'Usuário não encontrado.' }

// ---------------------------------------------------------------------------
// GEO — Geolocalização
// ---------------------------------------------------------------------------
export const GEO_001 = { code: 'GEO_CEP_NOT_FOUND', status: 404, message: 'CEP não encontrado.' }
export const GEO_002 = { code: 'GEO_VIACEP_UNAVAILABLE', status: 503, message: 'Serviço de CEP indisponível.' }
export const GEO_003 = { code: 'GEO_MAPBOX_UNAVAILABLE', status: 503, message: 'Serviço de geocoding indisponível.' }
export const GEO_004 = { code: 'GEO_INVALID_CEP', status: 422, message: 'CEP deve ter 8 dígitos numéricos.' }

// ---------------------------------------------------------------------------
// PUSH — Push Notifications
// ---------------------------------------------------------------------------
export const PUSH_001 = { code: 'PUSH_TOKEN_NOT_FOUND', status: 404, message: 'Token de push não encontrado.' }
export const PUSH_002 = { code: 'PUSH_INVALID_TOKEN', status: 422, message: 'Token de push inválido.' }

// ---------------------------------------------------------------------------
// BAN — Banner System (module-17)
// ---------------------------------------------------------------------------
export const BAN_001 = { code: 'BAN_001', status: 422, message: 'Saldo insuficiente de dias de banner.' }
export const BAN_002 = { code: 'BAN_002', status: 403, message: 'Acesso restrito a restaurantes doadores.' }
export const BAN_003 = { code: 'BAN_003', status: 404, message: 'Campanha de banner não encontrada.' }
export const BAN_004 = { code: 'BAN_004', status: 409, message: 'Campanha não pode ser alterada neste estado.' }
export const BAN_005 = { code: 'BAN_005', status: 400, message: 'Parâmetro position é obrigatório.' }

// ---------------------------------------------------------------------------
// MP — MercadoPago Connect (module-12)
// ---------------------------------------------------------------------------
export const MP_001 = { code: 'MP_UNAUTHENTICATED', status: 401, message: 'Sessão inválida ou ausente.' }
export const MP_002 = { code: 'MP_CSRF_INVALID', status: 400, message: 'Estado OAuth inválido ou expirado. Inicie o processo novamente.' }
export const MP_003 = { code: 'MP_ROLE_FORBIDDEN', status: 403, message: 'Apenas marmitarias podem conectar o Mercado Pago.' }
export const MP_004 = { code: 'MP_TOKEN_ERROR', status: 502, message: 'Falha ao obter tokens do Mercado Pago.' }
export const MP_005 = { code: 'MP_WEBHOOK_INVALID_SIGNATURE', status: 401, message: 'Assinatura de webhook inválida.' }
export const MP_006 = { code: 'MP_NOT_CONNECTED', status: 422, message: 'Marmitaria não possui conexão MP ativa.' }

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
export type ErrorEntry = { code: string; status: number; message: string }

export function errorResponse(entry: ErrorEntry, extra?: Record<string, unknown>) {
  return Response.json({ error: entry.code, message: entry.message, ...extra }, { status: entry.status })
}
