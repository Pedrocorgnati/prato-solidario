/**
 * DiplomaService — geração e gerenciamento de diplomas anuais PDF.
 *
 * Fluxo:
 *   1. Verifica se diploma já existe no banco (idempotente)
 *   2. Busca dados do usuário + MetricsService.getYearlySummary
 *   3. Gera PDF (via @react-pdf/renderer — instalar quando necessário)
 *   4. Upload para Supabase Storage bucket 'diplomas'
 *   5. Gera signed URL com TTL 90 dias
 *   6. Persiste/atualiza modelo Diploma
 *
 * @see module-20-gamificacao/TASK-4/ST001
 * @see intake-review/TASK-12
 */

import { prisma } from '@/lib/prisma'
import { BUCKETS, getSignedUrl } from '@/lib/storage'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { calcKgFoodSaved, calcKgCO2Avoided } from '@/lib/constants/impact'

// 90 dias em segundos
const SIGNED_URL_TTL_SECONDS = 90 * 24 * 60 * 60

export class DiplomaNotFoundError extends Error {
  constructor(public readonly code = 'VAL_050', message = 'Nenhuma doação registrada no período.') {
    super(message)
    this.name = 'DiplomaNotFoundError'
  }
}

export class DiplomaStorageError extends Error {
  constructor(public readonly code = 'SYS_003', message = 'Serviço de armazenamento indisponível.') {
    super(message)
    this.name = 'DiplomaStorageError'
  }
}

export class DiplomaService {
  /**
   * Gera ou recupera diploma anual para um usuário.
   * Idempotente: se diploma já existe no Storage, reutiliza (apenas renova URL).
   *
   * @returns { url, kgFoodSaved, kgCO2Avoided, totalMeals }
   */
  async generateDiploma(
    userId: string,
    year: number,
  ): Promise<{ url: string; kgFoodSaved: number; kgCO2Avoided: number; totalMeals: number }> {
    // 1. Verifica se diploma já existe no banco
    const existing = await prisma.diploma.findUnique({
      where: { userId_year: { userId, year } },
    })

    if (existing) {
      // Renovar URL se expirada ou ausente
      const needsRenewal =
        !existing.signedUrl ||
        !existing.signedUntil ||
        existing.signedUntil < new Date()

      // Buscar yearlyMeals para retornar dados ambientais mesmo para diplomas existentes
      const existingMeals = await this.getYearlyMeals(userId, year)

      if (!needsRenewal) {
        return {
          url: existing.signedUrl!,
          totalMeals: existingMeals,
          kgFoodSaved: calcKgFoodSaved(existingMeals),
          kgCO2Avoided: calcKgCO2Avoided(existingMeals),
        }
      }

      // Renovar signed URL (não re-gera o PDF)
      const storagePath = this.buildStoragePath(userId, year)
      const signedUrl = await this.createSignedUrl(storagePath)
      const signedUntil = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000)

      await prisma.diploma.update({
        where: { userId_year: { userId, year } },
        data: { signedUrl, signedUntil },
      })

      return {
        url: signedUrl,
        totalMeals: existingMeals,
        kgFoodSaved: calcKgFoodSaved(existingMeals),
        kgCO2Avoided: calcKgCO2Avoided(existingMeals),
      }
    }

    // 2. Verificar se usuário tem doações no ano
    const hasDonations = await this.userHasDonationsInYear(userId, year)
    if (!hasDonations) {
      throw new DiplomaNotFoundError('VAL_050', `Nenhuma doação registrada em ${year}`)
    }

    // 3. Buscar dados para o diploma
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })

    const yearlyMeals = await this.getYearlyMeals(userId, year)

    // 4. Gerar PDF (usa @react-pdf/renderer se instalado, fallback para placeholder)
    const pdfBuffer = await this.generateDiplomaPDFBuffer({
      name: userData?.name ?? 'Doador',
      year,
      totalMeals: yearlyMeals,
      kgFoodSaved: calcKgFoodSaved(yearlyMeals),
      kgCO2Avoided: calcKgCO2Avoided(yearlyMeals),
    })

    // 5. Upload para Supabase Storage
    const storagePath = this.buildStoragePath(userId, year)
    await this.uploadDiplomaPDF(storagePath, pdfBuffer)

    // 6. Gerar signed URL
    const signedUrl = await this.createSignedUrl(storagePath)
    const signedUntil = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000)

    // 7. Persistir no banco (idempotente via upsert)
    await prisma.diploma.upsert({
      where: { userId_year: { userId, year } },
      create: {
        userId,
        year,
        storageUrl: storagePath,
        signedUrl,
        signedUntil,
      },
      update: { signedUrl, signedUntil },
    })

    return {
      url: signedUrl,
      totalMeals: yearlyMeals,
      kgFoodSaved: calcKgFoodSaved(yearlyMeals),
      kgCO2Avoided: calcKgCO2Avoided(yearlyMeals),
    }
  }

  /**
   * Retorna URL assinada de diploma existente, renovando se necessário.
   * Retorna null se diploma não existe.
   */
  async getDiplomaUrl(userId: string, year: number): Promise<string | null> {
    const diploma = await prisma.diploma.findUnique({
      where: { userId_year: { userId, year } },
    })

    if (!diploma) return null

    const needsRenewal =
      !diploma.signedUrl ||
      !diploma.signedUntil ||
      diploma.signedUntil < new Date()

    if (!needsRenewal) return diploma.signedUrl!

    const signedUrl = await this.createSignedUrl(diploma.storageUrl)
    const signedUntil = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000)

    await prisma.diploma.update({
      where: { userId_year: { userId, year } },
      data: { signedUrl, signedUntil },
    })

    return signedUrl
  }

  /**
   * Gera diplomas para todos os usuários com ao menos 1 doação no ano.
   * Chamado pelo cron anual. Idempotente — skips usuários já processados.
   * Processa em batches de 50 para evitar timeout do Vercel.
   */
  async generateAllYearDiplomas(year: number): Promise<{
    generated: number
    skipped: number
    errors: string[]
  }> {
    const donors = await this.getDonorIdsWithDonationsInYear(year)
    const errors: string[] = []
    let generated = 0
    let skipped = 0

    // Batches de 50 para evitar timeout
    const BATCH_SIZE = 50
    for (let i = 0; i < donors.length; i += BATCH_SIZE) {
      const batch = donors.slice(i, i + BATCH_SIZE)
      await Promise.allSettled(
        batch.map(async (userId) => {
          try {
            const existing = await prisma.diploma.findUnique({
              where: { userId_year: { userId, year } },
              select: { id: true },
            })
            if (existing) {
              skipped++
              return
            }
            await this.generateDiploma(userId, year)
            generated++
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            errors.push(`userId=${userId}: ${msg}`)
            console.warn(`[DiplomaService] Erro diploma userId=${userId}:`, msg)
          }
        })
      )
    }

    return { generated, skipped, errors }
  }

  /**
   * Lista anos com diploma disponível para um usuário.
   */
  async getDiplomaYearsForUser(userId: string): Promise<number[]> {
    const diplomas = await prisma.diploma.findMany({
      where: { userId },
      select: { year: true },
      orderBy: { year: 'desc' },
    })
    return diplomas.map((d) => d.year)
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  private buildStoragePath(userId: string, year: number): string {
    // Caminho não previsível por ID sequencial
    return `${userId}/${year}/diploma.pdf`
  }

  private async uploadDiplomaPDF(path: string, pdfBuffer: Buffer): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) throw new DiplomaStorageError()

    const supabase = createClient(supabaseUrl, serviceKey)
    const { error } = await supabase.storage
      .from(BUCKETS.DIPLOMAS)
      .upload(path, pdfBuffer, {
        upsert: true,
        contentType: 'application/pdf',
      })

    if (error) throw new DiplomaStorageError('SYS_003', `Storage error: ${error.message}`)
  }

  private async createSignedUrl(path: string): Promise<string> {
    return getSignedUrl(BUCKETS.DIPLOMAS, path, SIGNED_URL_TTL_SECONDS)
  }

  private async userHasDonationsInYear(userId: string, year: number): Promise<boolean> {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)

    const count = await prisma.retrievalCode.count({
      where: {
        donation: { donorId: userId },
        status: 'CONFIRMED',
        updatedAt: { gte: startDate, lt: endDate },
      },
    })
    return count > 0
  }

  private async getYearlyMeals(userId: string, year: number): Promise<number> {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)

    const result = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM(rc.portions), 0)::bigint AS total
      FROM retrieval_codes rc
      JOIN donations d ON rc.donation_id = d.id
      WHERE rc.status = 'CONFIRMED'
        AND d.donor_id = ${userId}
        AND rc.updated_at >= ${startDate}
        AND rc.updated_at < ${endDate}
    `
    return Number(result[0]?.total ?? 0)
  }

  private async getDonorIdsWithDonationsInYear(year: number): Promise<string[]> {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)

    const rows = await prisma.$queryRaw<{ donorId: string }[]>`
      SELECT DISTINCT d.donor_id AS "donorId"
      FROM retrieval_codes rc
      JOIN donations d ON rc.donation_id = d.id
      WHERE rc.status = 'CONFIRMED'
        AND rc.updated_at >= ${startDate}
        AND rc.updated_at < ${endDate}
    `
    return rows.map((r) => r.donorId)
  }

  /**
   * Gera PDF via @react-pdf/renderer se instalado; fallback para placeholder.
   * INSTALAÇÃO: npm install @react-pdf/renderer
   * @see intake-review/TASK-17
   */
  private async generateDiplomaPDFBuffer(data: {
    name: string
    year: number
    totalMeals: number
    kgFoodSaved: number
    kgCO2Avoided: number
    city?: string
  }): Promise<Buffer> {
    try {
      const { renderToBuffer } = await import('@react-pdf/renderer')
      const { DiplomaTemplate } = await import('@/components/pdf/DiplomaTemplate')
      // React é necessário para o JSX do template
      const React = (await import('react')).default
      return await renderToBuffer(
        React.createElement(DiplomaTemplate, { data }),
      ) as Buffer
    } catch {
      // Fallback: placeholder PDF quando @react-pdf/renderer não está instalado
      return this.generatePlaceholderPDF(data.name, data.year, data.totalMeals)
    }
  }

  /**
   * PLACEHOLDER — substituir por @react-pdf/renderer quando instalado.
   * Gera um PDF mínimo válido com os dados do diploma.
   * Instrução: npm install @react-pdf/renderer
   */
  private generatePlaceholderPDF(name: string, year: number, totalMeals: number): Buffer {
    // PDF mínimo estruturalmente válido (placeholder até integrar @react-pdf/renderer)
    const sanitizedName = name.replace(/[<>]/g, '')
    const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>>/Contents 4 0 R>>endobj
4 0 obj<</Length 200>>
stream
BT
/F1 24 Tf
100 750 Td
(DIPLOMA DE RECONHECIMENTO) Tj
/F1 16 Tf
0 -60 Td
(${sanitizedName}) Tj
0 -40 Td
(Ano: ${year}) Tj
0 -40 Td
(${totalMeals} refei\\347\\365es doadas) Tj
0 -40 Td
(Prato Solid\\341rio) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000062 00000 n
0000000118 00000 n
0000000310 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
560
%%EOF`
    return Buffer.from(content, 'utf-8')
  }
}

// ---------------------------------------------------------------------------
// Email types (TASK-12 — CL-142)
// ---------------------------------------------------------------------------

export interface SendDiplomaEmailParams {
  userId: string
  diplomaUrl: string
  year: number
  impactSummary?: { totalDonations: number; familiesBenefited?: number }
}

export interface SendDiplomaEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// ---------------------------------------------------------------------------
// sendDiplomaEmail — ST001
// ---------------------------------------------------------------------------

/**
 * Envia email de diploma via Resend com link de download e resumo de impacto.
 * @see intake-review/TASK-12/ST001
 */
export async function sendDiplomaEmail(
  params: SendDiplomaEmailParams
): Promise<SendDiplomaEmailResult> {
  const { userId, diplomaUrl, year, impactSummary } = params

  const resendApiKey = env.RESEND_API_KEY
  if (!resendApiKey) {
    console.warn('[sendDiplomaEmail] RESEND_API_KEY não configurada — email pulado')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  // Buscar dados do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  })

  if (!user?.email) {
    return { success: false, error: 'Usuário sem email cadastrado' }
  }

  const name = user.name ?? 'Doador'
  const firstName = name.split(' ')[0]
  const totalDonations = impactSummary?.totalDonations ?? 0
  const familiesBenefited = impactSummary?.familiesBenefited ?? totalDonations

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: #22c55e; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏆 Diploma de Reconhecimento</h1>
    <p style="color: #dcfce7; margin: 8px 0 0;">Prato Solidário — ${year}</p>
  </div>
  <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <p style="font-size: 18px; color: #1f2937;">Olá, <strong>${firstName}</strong>!</p>
    <p style="color: #374151; line-height: 1.6;">
      É com muito orgulho que reconhecemos sua contribuição em <strong>${year}</strong>.
      Graças à sua generosidade, você ajudou a transformar excedentes em dignidade.
    </p>
    ${totalDonations > 0 ? `
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; color: #15803d; font-size: 32px; font-weight: bold;">${totalDonations}</p>
      <p style="margin: 4px 0 0; color: #166534;">doações realizadas</p>
      ${familiesBenefited > 0 ? `<p style="margin: 12px 0 0; color: #374151; font-size: 14px;">~${familiesBenefited} famílias beneficiadas</p>` : ''}
    </div>` : ''}
    <div style="text-align: center; margin: 32px 0;">
      <a href="${diplomaUrl}"
         style="background: #22c55e; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        📄 Baixar meu Diploma
      </a>
    </div>
    <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">
      O link de download é válido por 90 dias. Prato Solidário — Transformando excedentes em dignidade.
    </p>
  </div>
</body>
</html>`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Prato Solidário <noreply@pratosolidario.com.br>',
        to: user.email,
        subject: `🏆 Seu Diploma de Reconhecimento ${year} está pronto!`,
        html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error')
      throw new Error(`Resend API error (${response.status}): ${errorText}`)
    }

    const data = await response.json() as { id?: string }
    return { success: true, messageId: data.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[sendDiplomaEmail] Falha ao enviar:', message)
    return { success: false, error: message }
  }
}

export const diplomaService = new DiplomaService()
