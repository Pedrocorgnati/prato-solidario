/**
 * POST /api/v1/contact — Formulário de contato de parceiros.
 *
 * - Público (sem autenticação)
 * - Valida dados com Zod
 * - Rate limit: 3 submissões/IP/hora
 * - Envia email ao admin via Resend
 * - Registra AuditLog
 *
 * @see intake-review/TASK-14/ST002
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkApiRateLimit, rateLimitHeaders } from '@/lib/api-rate-limit'

const contactSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email().max(254),
  tipo: z.enum(['MARMITARIA', 'RESTAURANTE', 'ONG', 'PATROCINADOR', 'OUTRO']),
  mensagem: z.string().min(10).max(1000),
})

const TIPO_LABELS: Record<string, string> = {
  MARMITARIA: 'Marmitaria',
  RESTAURANTE: 'Restaurante',
  ONG: 'ONG / Associação',
  PATROCINADOR: 'Patrocinador / Empresa',
  OUTRO: 'Outro',
}

export async function POST(req: NextRequest) {
  // Rate limit: 3 req/hora por IP
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Janela de 1 hora (3 600 000 ms) com max 3 requisições
  const rl = checkApiRateLimit(`contact:${clientIp}`, 3, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'RATE_001', message: 'Muitas solicitações. Tente novamente em 1 hora.' },
      {
        status: 429,
        headers: { ...rateLimitHeaders(rl), 'Retry-After': '3600' },
      },
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'VAL_001', message: 'Corpo da requisição inválido.' },
      { status: 400 },
    )
  }

  // Validação
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VAL_002', message: 'Dados inválidos.', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { nome, email, tipo, mensagem } = parsed.data

  // Enviar email via Resend
  const resendKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? 'admin@pratosolidario.com.br'

  if (resendKey) {
    try {
      const emailBody = {
        from: 'Prato Solidário <noreply@pratosolidario.com.br>',
        to: [adminEmail],
        reply_to: email,
        subject: `[Contato Parceiro] ${TIPO_LABELS[tipo] ?? tipo} — ${nome}`,
        html: `
          <h2>Nova solicitação de parceria</h2>
          <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
            <tr><th align="left">Nome</th><td>${escapeHtml(nome)}</td></tr>
            <tr><th align="left">E-mail</th><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
            <tr><th align="left">Tipo</th><td>${escapeHtml(TIPO_LABELS[tipo] ?? tipo)}</td></tr>
            <tr><th align="left">Mensagem</th><td style="white-space:pre-wrap">${escapeHtml(mensagem)}</td></tr>
          </table>
        `,
      }

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailBody),
      })

      if (!resendRes.ok) {
        console.error('[POST /api/v1/contact] Resend error', resendRes.status)
      }
    } catch (err) {
      console.error('[POST /api/v1/contact] Email send failed:', err)
      // Não falhar a requisição por erro de email
    }
  }

  // AuditLog (não bloqueia resposta)
  prisma.auditLog
    .create({
      data: {
        action: 'CONTACT_FORM_SUBMITTED',
        entityType: 'ContactForm',
        metadata: {
          ip: clientIp,
          tipo,
          emailHash: hashEmail(email),
        },
      },
    })
    .catch((err: unknown) => {
      console.warn('[POST /api/v1/contact] AuditLog failed:', err)
    })

  return NextResponse.json({ success: true }, { status: 200 })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** Hash simples para AuditLog — não expõe email real */
function hashEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  const masked = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : '***'
  return `${masked}@${domain}`
}
