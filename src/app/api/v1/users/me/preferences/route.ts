/**
 * GET/PUT /api/v1/users/me/preferences — TASK-5 (intake-review) LGPD.
 *
 * Ressalva P2: preferencias persistidas via AuditLog (metadata.preferences)
 * ate que exista migration dedicada. Ver src/lib/services/notification-preferences.ts.
 */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { authService } from '@/services/auth.service'
import { errorResponse, AUTH_007, SYS_001 } from '@/constants/errors'
import {
  getPreferences,
  updatePreferences,
  type NotificationPreferences,
} from '@/lib/services/notification-preferences'

const preferencesSchema = z
  .object({
    analytics: z.boolean().optional(),
    geolocation: z.boolean().optional(),
    pushCodeGenerated: z.boolean().optional(),
    pushSobrou: z.boolean().optional(),
    pushAdmin: z.boolean().optional(),
    emailMarketing: z.boolean().optional(),
  })
  .strict()

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return null
  const auth = await authService.getSessionFromToken(token)
  return auth?.userId ?? null
}

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request)
  if (!userId) return errorResponse(AUTH_007)

  try {
    const preferences = await getPreferences(userId)
    return Response.json({ data: preferences })
  } catch {
    return errorResponse(SYS_001)
  }
}

export async function PUT(request: NextRequest) {
  const userId = await getAuthUserId(request)
  if (!userId) return errorResponse(AUTH_007)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = preferencesSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      {
        error: 'VAL_002',
        message: 'Dados inválidos.',
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    )
  }

  const ip = request.headers.get('x-forwarded-for') ?? undefined

  try {
    const preferences: NotificationPreferences = await updatePreferences(
      userId,
      parsed.data,
      ip,
    )
    return Response.json({ data: preferences })
  } catch {
    return errorResponse(SYS_001)
  }
}
