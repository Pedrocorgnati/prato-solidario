/**
 * GET /api/v1/map/token
 * Retorna o token Mapbox público (escopo restrito) server-side.
 *
 * Guardrail: MAPBOX_ACCESS_TOKEN (secreto) nunca exposto no bundle cliente.
 * Usa NEXT_PUBLIC_MAPBOX_TOKEN (escopo mínimo: leitura de tiles) quando disponível.
 * Cabeçalho Referrer-Policy: strict-origin para restringir uso do token.
 *
 * @see module-21-heatmap/TASK-2/ST001
 */

import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET() {
  const token = env.NEXT_PUBLIC_MAPBOX_TOKEN ?? env.MAPBOX_ACCESS_TOKEN

  if (!token) {
    console.warn('[GET /api/v1/map/token] NEXT_PUBLIC_MAPBOX_TOKEN não configurado')
    return NextResponse.json(
      { error: 'CONFIG_001', message: 'Token de mapa não configurado' },
      { status: 503 },
    )
  }

  return NextResponse.json(
    { token },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Referrer-Policy': 'strict-origin',
      },
    },
  )
}
