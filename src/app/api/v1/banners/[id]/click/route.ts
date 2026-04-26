/**
 * POST /api/v1/banners/:id/click
 * Rastreia clique em banner (público, sem auth, fire-and-forget).
 * Rate limiting: máx 10 cliques por IP por banner por hora (anti-fraude).
 * @see module-17-banners-system/TASK-4/ST004
 */

import { NextRequest } from 'next/server'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import { bannerRepository } from '@/repositories/banner.repository'

const clickCounts = new Map<string, { count: number; resetAt: number }>()
const CLICK_LIMIT = 10
const CLICK_WINDOW_MS = 60 * 60 * 1000 // 1 hora

function isClickAllowed(ip: string, bannerId: string): boolean {
  const key = `${ip}:${bannerId}`
  const now = Date.now()
  const entry = clickCounts.get(key)

  if (!entry || now >= entry.resetAt) {
    clickCounts.set(key, { count: 1, resetAt: now + CLICK_WINDOW_MS })
    return true
  }

  if (entry.count >= CLICK_LIMIT) return false
  entry.count++
  return true
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const userAgent = request.headers.get('user-agent') ?? ''
  const position = request.nextUrl.searchParams.get('position') ?? ''

  if (!isClickAllowed(ip, id)) {
    return new Response(null, { status: 429 })
  }

  // Fire-and-forget: incrementar clicks + audit log em background
  Promise.all([
    bannerRepository.incrementClicks(id),
    auditLogRepository.log('BANNER_CLICK', 'banner_campaign', {
      entityId: id,
      metadata: { ip, userAgent, position },
    }),
  ]).catch((err) => {
    console.error('[POST /banners/:id/click] background error:', err)
  })

  // Retorna imediatamente sem aguardar processamento
  return new Response(null, { status: 204 })
}
