import { createClient } from '@supabase/supabase-js'

/**
 * Helpers para Supabase Storage — upload, signed URL, URL pública, delete.
 * @see module-2-shared-foundations/TASK-8/ST001
 *
 * Erros: SYS_003 (storage indisponível), VAL_005 (arquivo inválido)
 */

// ---------------------------------------------------------------------------
// Constantes de buckets
// ---------------------------------------------------------------------------

export const BUCKETS = {
  AVATARS: 'avatars',
  BANNERS: 'banners',
  DIPLOMAS: 'diplomas',
} as const

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS]

// ---------------------------------------------------------------------------
// Limites por bucket (em bytes)
// ---------------------------------------------------------------------------

const BUCKET_SIZE_LIMITS: Record<BucketName, number> = {
  [BUCKETS.AVATARS]: 5 * 1024 * 1024,  // 5 MB
  [BUCKETS.BANNERS]: 2 * 1024 * 1024,  // 2 MB
  [BUCKETS.DIPLOMAS]: 10 * 1024 * 1024, // 10 MB
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// ---------------------------------------------------------------------------
// Cliente admin (server-side)
// ---------------------------------------------------------------------------

function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase URL ou Service Key não configurados.')
  }

  return createClient(supabaseUrl, serviceKey)
}

// ---------------------------------------------------------------------------
// Resultado de upload
// ---------------------------------------------------------------------------

export type UploadResult =
  | { url: string; error: null }
  | { url: null; error: string }

// ---------------------------------------------------------------------------
// Funções principais
// ---------------------------------------------------------------------------

/**
 * Faz upload de um arquivo para o bucket especificado.
 * Valida MIME type e tamanho antes de enviar.
 */
export async function uploadFile(
  bucket: BucketName,
  path: string,
  file: File
): Promise<UploadResult> {
  // Validação de MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      url: null,
      error: 'Formato não suportado. Use JPEG, PNG ou WebP.',
    }
  }

  // Validação de tamanho
  const maxBytes = BUCKET_SIZE_LIMITS[bucket] ?? 5 * 1024 * 1024
  const maxMb = Math.round(maxBytes / (1024 * 1024))
  if (file.size > maxBytes) {
    return {
      url: null,
      error: `Arquivo muito grande (máx. ${maxMb}MB).`,
    }
  }

  try {
    const supabase = getStorageClient()

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type })

    if (error) {
      return {
        url: null,
        error: 'Serviço de armazenamento temporariamente indisponível.',
      }
    }

    const url = getPublicUrl(bucket, path)
    return { url, error: null }
  } catch {
    return {
      url: null,
      error: 'Serviço de armazenamento temporariamente indisponível.',
    }
  }
}

/**
 * Remove um arquivo do bucket.
 * Retorna true em caso de sucesso, false em caso de erro.
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<boolean> {
  try {
    const supabase = getStorageClient()
    const { error } = await supabase.storage.from(bucket).remove([path])
    return !error
  } catch {
    return false
  }
}

/**
 * Gera URL assinada com expiração (default: 3600s).
 */
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = getStorageClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error || !data?.signedUrl) {
    throw new Error(`Não foi possível gerar URL assinada: ${error?.message}`)
  }

  return data.signedUrl
}

/**
 * Retorna URL pública direta (para buckets públicos).
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurado.')
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}
