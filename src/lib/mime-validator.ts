/**
 * Validação de MIME type por magic bytes (SEC-018).
 * Evita MIME spoofing: arquivo renomeado como .jpg mas com conteúdo malicioso.
 */

const MAGIC_BYTES: Record<string, readonly number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header (WebP = RIFF????WEBP)
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']

/**
 * Verifica MIME type real a partir dos magic bytes do buffer.
 * @returns mime type detectado ou null se não reconhecido / não permitido
 */
export function detectMimeType(buffer: Uint8Array): string | null {
  for (const [mime, magic] of Object.entries(MAGIC_BYTES)) {
    if (!ALLOWED_MIME_TYPES.includes(mime)) continue
    const matches = magic.every((byte, i) => buffer[i] === byte)
    if (matches) return mime
  }
  return null
}

/**
 * Valida arquivo de imagem: MIME real + tamanho máximo.
 * @returns { valid: boolean; error?: string }
 */
export function validateBannerImage(
  buffer: Uint8Array,
  maxBytes = 2 * 1024 * 1024 // 2MB
): { valid: boolean; error?: string } {
  if (buffer.byteLength > maxBytes) {
    return { valid: false, error: `Imagem deve ter no máximo ${maxBytes / 1024 / 1024}MB.` }
  }

  const detected = detectMimeType(buffer)
  if (!detected) {
    return { valid: false, error: 'Formato inválido. Use JPG ou PNG.' }
  }

  return { valid: true }
}
