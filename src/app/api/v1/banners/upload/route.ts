/**
 * POST /api/v1/banners/upload
 * Upload de arte de banner para Supabase Storage (bucket banners-restaurante).
 * Valida MIME real via magic bytes (SEC-018). Máx 2MB.
 * @see module-17-banners-system/TASK-3/ST004
 */

import { NextRequest } from 'next/server'
import { UserRole } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateBannerImage } from '@/lib/mime-validator'
import { errorResponse, AUTH_007, BAN_002, SYS_001 } from '@/constants/errors'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const BUCKET_NAME = 'banners-restaurante'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  if (auth.role !== UserRole.DOADOR_RESTAURANTE) {
    return errorResponse(BAN_002)
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'FormData inválido.' })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Arquivo não enviado.' })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  const validation = validateBannerImage(buffer, MAX_SIZE_BYTES)
  if (!validation.valid) {
    return Response.json({ error: 'VAL_004', message: validation.error }, { status: 422 })
  }

  try {
    const supabase = await createSupabaseServerClient()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const fileName = `${auth.userId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (error) {
      console.error('[POST /banners/upload] storage error:', error)
      return errorResponse(SYS_001)
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)

    return Response.json({ url: publicUrlData.publicUrl }, { status: 201 })
  } catch (err) {
    console.error('[POST /banners/upload]', err)
    return errorResponse(SYS_001)
  }
}
