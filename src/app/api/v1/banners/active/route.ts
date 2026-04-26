/**
 * GET /api/v1/banners/active?position=TOP|SIDEBAR|INLINE
 * Endpoint público — retorna banners ativos para uma posição.
 * Cache 5min (s-maxage=300) + stale-while-revalidate 60s.
 * @see module-17-banners-system/TASK-4/ST003
 */

import { NextRequest } from 'next/server'
import { BannerPosition } from '@/types/enums'
import { bannerService } from '@/services/banner.service'
import { errorResponse, BAN_005, SYS_001 } from '@/constants/errors'

const ALLOWED_POSITIONS = Object.values(BannerPosition)

export async function GET(request: NextRequest) {
  const position = request.nextUrl.searchParams.get('position') as BannerPosition | null

  if (!position || !ALLOWED_POSITIONS.includes(position)) {
    return errorResponse(BAN_005)
  }

  try {
    const banners = await bannerService.getActiveBanners(position)

    return Response.json(
      { banners },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch {
    return errorResponse(SYS_001)
  }
}
