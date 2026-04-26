/**
 * Builder de NextRequest para testes de integração.
 * Cria instâncias de NextRequest com os headers e body corretos.
 */

import { NextRequest } from 'next/server'

const BASE_URL = 'http://localhost:3000/api/v1'

interface RequestOptions {
  method?: string
  body?: unknown
  token?: string
  headers?: Record<string, string>
  /** IP simulado para testes de rate limit e auditoria */
  ip?: string
}

export function buildRequest(path: string, options: RequestOptions = {}): NextRequest {
  const { method = 'GET', body, token, headers = {}, ip } = options

  const reqHeaders: Record<string, string> = {
    'content-type': 'application/json',
    ...headers,
  }

  if (token) {
    reqHeaders['authorization'] = `Bearer ${token}`
  }

  if (ip) {
    reqHeaders['x-forwarded-for'] = ip
  }

  return new NextRequest(`${BASE_URL}${path}`, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

/** Helpers semânticos */
export const req = {
  get:    (path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    buildRequest(path, { ...opts, method: 'GET' }),

  post:   (path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    buildRequest(path, { ...opts, method: 'POST', body }),

  patch:  (path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    buildRequest(path, { ...opts, method: 'PATCH', body }),

  delete: (path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    buildRequest(path, { ...opts, method: 'DELETE' }),
}

/**
 * Lê o body JSON de uma Response sem consumir o stream.
 */
export async function parseBody<T = unknown>(response: Response): Promise<T> {
  const text = await response.text()
  return JSON.parse(text) as T
}
