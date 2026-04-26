/**
 * POST /api/v1/admin/banners/upload
 * Upload de arte de banner para Supabase Storage (bucket banners-admin).
 * Valida MIME real via magic bytes (SEC-018). Máx 2MB.
 * Requer role ADMIN.
 * @see module-17-banners-system/TASK-1/ST001
 */

import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateBannerImage } from '@/lib/mime-validator'
import { errorResponse, AUTH_007, SYS_001 } from '@/constants/errors'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const BUCKET_NAME = 'banners-admin'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  if (auth.role !== 'ADMIN') {
    return errorResponse({ code: 'AUTH_006', status: 403, message: 'Acesso restrito a administradores.' })
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
    const fileName = `admin/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (error) {
      console.error('[POST /admin/banners/upload] storage error:', error)
      return errorResponse(SYS_001)
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)

    return Response.json({ url: publicUrlData.publicUrl }, { status: 201 })
  } catch (err) {
    console.error('[POST /admin/banners/upload]', err)
    return errorResponse(SYS_001)
  }
}
