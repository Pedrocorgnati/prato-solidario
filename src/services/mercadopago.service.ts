/**
 * MPConnectService — OAuth MercadoPago Connect para marmitarias.
 * Responsabilidades: geração de URL OAuth, troca de código, refresh de tokens.
 *
 * INT-097: MP Connect OAuth | INT-117: Segurança OAuth | FEAT-MM-001
 */
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { encrypt, decrypt, safeCompare } from '@/lib/mp-crypto'
import { env } from '@/lib/env'
import { mpConnectionRepository } from '@/repositories/mp-connection.repository'

const MP_OAUTH_COOKIE = 'mp_oauth_state'
const MP_OAUTH_COOKIE_MAX_AGE = 600 // 10 minutos

export interface MPOAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  mpUserId: string
  publicKey?: string
  liveMode?: boolean
}

export interface MPRefreshResult {
  success: boolean
  error?: string
}

/**
 * Gera a URL de autorização OAuth do MercadoPago e define o cookie CSRF.
 */
export async function getAuthUrl(marmitariaId: string): Promise<string> {
  const appId = env.MP_APP_ID
  const redirectUri = env.MP_REDIRECT_URI

  if (!appId || !redirectUri) {
    throw new Error('MP_APP_ID e MP_REDIRECT_URI são obrigatórios para OAuth')
  }

  const state = crypto.randomUUID()

  // Armazena state + marmitariaId no cookie httpOnly
  const cookieStore = await cookies()
  cookieStore.set(MP_OAUTH_COOKIE, JSON.stringify({ state, marmitariaId }), {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MP_OAUTH_COOKIE_MAX_AGE,
    path: '/',
  })

  const params = new URLSearchParams({
    client_id: appId,
    response_type: 'code',
    platform_id: 'mp',
    state,
    redirect_uri: redirectUri,
  })

  return `https://auth.mercadopago.com.br/authorization?${params.toString()}`
}

/**
 * Valida o state CSRF e troca o código OAuth por tokens.
 * Retorna os tokens descriptografados para persistência imediata.
 */
export async function handleCallback(
  code: string,
  state: string
): Promise<{ marmitariaId: string; tokens: MPOAuthTokens } | { error: string; code: string }> {
  const cookieStore = await cookies()
  const cookieRaw = cookieStore.get(MP_OAUTH_COOKIE)?.value

  if (!cookieRaw) {
    return { error: 'Cookie de estado OAuth ausente ou expirado', code: 'AUTH_002' }
  }

  let cookieData: { state: string; marmitariaId: string }
  try {
    cookieData = JSON.parse(cookieRaw)
  } catch {
    return { error: 'Cookie de estado OAuth corrompido', code: 'AUTH_002' }
  }

  // Comparação resistente a timing attacks
  if (!safeCompare(cookieData.state, state)) {
    return { error: 'State CSRF inválido — possível ataque CSRF', code: 'AUTH_002' }
  }

  // Remove cookie CSRF imediatamente após validação
  cookieStore.delete(MP_OAUTH_COOKIE)

  // Troca código por tokens
  const tokens = await exchangeCodeForTokens(code)
  if ('error' in tokens) {
    return tokens
  }

  return { marmitariaId: cookieData.marmitariaId, tokens }
}

/**
 * Troca o código de autorização por tokens do MercadoPago.
 */
async function exchangeCodeForTokens(
  code: string
): Promise<MPOAuthTokens | { error: string; code: string }> {
  const appId = env.MP_APP_ID
  const clientSecret = env.MP_CLIENT_SECRET
  const redirectUri = env.MP_REDIRECT_URI

  if (!appId || !clientSecret || !redirectUri) {
    return { error: 'Configuração OAuth incompleta no servidor', code: 'SYS_003' }
  }

  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: appId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        test_token: env.NODE_ENV !== 'production',
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('[MP OAuth] Falha na troca de código:', { status: response.status, body })
      return { error: 'Falha ao obter tokens do MercadoPago', code: 'SYS_003' }
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      mpUserId: String(data.user_id),
      publicKey: data.public_key,
      liveMode: data.live_mode ?? false,
    }
  } catch (err) {
    console.error('[MP OAuth] Erro de rede na troca de código:', err)
    return { error: 'Erro de comunicação com o MercadoPago', code: 'SYS_003' }
  }
}

/**
 * Renova os tokens via refresh_token.
 * Em caso de falha: marca a conexão como NEEDS_RECONNECT.
 */
export async function refreshMPToken(marmitariaId: string): Promise<MPRefreshResult> {
  const connection = await mpConnectionRepository.findByMarmitariaId(marmitariaId)
  if (!connection || !connection.refreshTokenEncrypted) {
    return { success: false, error: 'Conexão MP não encontrada' }
  }

  let refreshToken: string
  try {
    refreshToken = decrypt(connection.refreshTokenEncrypted)
  } catch {
    await mpConnectionRepository.markNeedsReconnect(connection.id)
    return { success: false, error: 'Erro ao descriptografar refresh_token' }
  }

  // 2 tentativas com backoff — o sleep é intencional apenas em context de cron/background
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await doRefreshToken(refreshToken)
      if ('error' in result) {
        if (attempt === 2) {
          await mpConnectionRepository.markNeedsReconnect(connection.id)
          // Notificação disparada via notification.service (NOTIF-MP-001)
          console.warn('[MP Refresh] Falha após 2 tentativas — NEEDS_RECONNECT', {
            marmitariaId,
            connectionId: connection.id,
          })
          return { success: false, error: result.error }
        }
        await new Promise((r) => setTimeout(r, 5000))
        continue
      }

      await mpConnectionRepository.updateTokens(connection.id, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      })
      return { success: true }
    } catch (err) {
      console.error('[MP Refresh] Erro inesperado tentativa', attempt, err)
      if (attempt === 2) {
        await mpConnectionRepository.markNeedsReconnect(connection.id)
        return { success: false, error: 'Erro inesperado ao renovar tokens' }
      }
      await new Promise((r) => setTimeout(r, 5000))
    }
  }

  return { success: false, error: 'Falha no refresh após retries' }
}

async function doRefreshToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date } | { error: string }> {
  const appId = env.MP_APP_ID
  const clientSecret = env.MP_CLIENT_SECRET

  if (!appId || !clientSecret) {
    return { error: 'Configuração OAuth incompleta' }
  }

  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: appId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      return { error: `MP rejeitou refresh: HTTP ${response.status}` }
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  } catch {
    return { error: 'Erro de rede durante refresh' }
  }
}

/**
 * Retorna o access_token válido para uma marmitaria.
 * Realiza refresh lazy se o token estiver expirado.
 * Retorna null se a conexão não existir, estiver inativa ou o refresh falhar.
 */
export async function getValidToken(marmitariaId: string): Promise<string | null> {
  const connection = await mpConnectionRepository.findByMarmitariaId(marmitariaId)

  if (!connection || !connection.accessTokenEncrypted) return null
  if (connection.status === 'NEEDS_RECONNECT' || connection.status === 'DISCONNECTED') return null

  // Token ainda válido
  if (connection.expiresAt && connection.expiresAt > new Date()) {
    try {
      return decrypt(connection.accessTokenEncrypted)
    } catch {
      return null
    }
  }

  // Token expirado — tenta refresh lazy
  const refreshResult = await refreshMPToken(marmitariaId)
  if (!refreshResult.success) return null

  // Busca o token recém-renovado
  const updated = await mpConnectionRepository.findByMarmitariaId(marmitariaId)
  if (!updated?.accessTokenEncrypted) return null

  try {
    return decrypt(updated.accessTokenEncrypted)
  } catch {
    return null
  }
}

/**
 * Valida a assinatura HMAC-SHA256 do webhook do MercadoPago.
 * Formato do header x-signature: "ts=...,v1=..."
 */
export function validateWebhookSignature(
  rawBody: string,
  xSignature: string,
  xRequestId: string
): boolean {
  const webhookSecret = env.MP_WEBHOOK_SECRET
  if (!webhookSecret) return false

  // Parseia "ts=...,v1=..."
  const parts: Record<string, string> = {}
  for (const part of xSignature.split(',')) {
    const [k, v] = part.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  }

  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) return false

  // Constrói manifest conforme documentação MP
  const manifest = `id:${xRequestId};request-date:${ts};`
  const expected = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex')

  return safeCompare(v1, expected)
}

// Exporta encrypt para uso no repository (persistência de tokens)
export { encrypt, decrypt }
