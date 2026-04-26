import { runHealthChecks } from '@/lib/health'
import { captureException } from '@/lib/sentry'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await runHealthChecks()
    const httpStatus = result.status === 'down' ? 503 : 200
    return Response.json(result, { status: httpStatus })
  } catch (err) {
    logger.error({ err }, 'v1 health check failed unexpectedly')
    captureException(err, { route: '/api/v1/health' })
    return Response.json(
      { status: 'down', error: 'health check unavailable', timestamp: new Date().toISOString() },
      { status: 503 },
    )
  }
}
