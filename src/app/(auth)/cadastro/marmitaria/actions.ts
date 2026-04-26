'use server'

import { headers } from 'next/headers'
import { userService } from '@/services/user.service'
import { recordConsent } from '@/services/consent.service'
import { sanitizeRegistrationError } from '@/services/register.service'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { registerMarmitariaSchema } from '@/types/register.types'
import type { RegisterResult } from '@/types/register.types'

/**
 * Server Action: cadastro de Marmitaria (6 etapas).
 *
 * Fluxo:
 * 1. Valida input com Zod
 * 2. Cria usuário Supabase Auth + User Prisma com role MARMITARIA e status PENDING_APPROVAL
 * 3. Cria Address + geocoding server-side
 * 4. Registra consentimento LGPD
 * 5. Envia e-mail de verificação (NOTIF-001)
 * 6. Notifica admin (NOTIF-008): nova marmitaria aguardando aprovação
 *
 * Nota: MP OAuth é placeholder — implementado em module-12.
 *
 * @see module-4-auth-register/TASK-5/ST005
 * @see NOTIF-008: Admin notificado via AuditLog com flag 'ADMIN_ACTION_REQUIRED'
 */
export async function registerMarmitariaAction(
  rawData: unknown
): Promise<RegisterResult> {
  const parsed = registerMarmitariaSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return { success: false, error: firstIssue?.message ?? 'Dados inválidos' }
  }
  const data = parsed.data

  const hdrs = await headers()
  const ipAddress = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? hdrs.get('x-real-ip') ?? undefined
  const userAgent = hdrs.get('user-agent') ?? undefined

  let userId: string | undefined

  try {
    const user = await userService.createMarmitaria(
      {
        name: data.tradeName,
        email: data.email,
        password: data.password,
        phone: data.phone ?? '',
        // Usa CNPJ se fornecido (marmitaria formal), senão CPF do responsável (informal)
        document: (data.cnpj && data.cnpj.length >= 14) ? data.cnpj : data.cpf,
        // CreateMarmitariaInput.photoUrl é required, mas o campo é opcional no formulário
        photoUrl: data.photoUrl ?? '',
        price: data.pricePerMeal ?? 0,
        schedule: {
          days: data.deliveryDays.map((d) => {
            const dayMap: Record<number, 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'> = {
              1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab', 0: 'dom',
            }
            return dayMap[d] ?? 'seg'
          }),
          start: Object.values(data.deliveryHours)[0]?.open ?? '08:00',
          end: Object.values(data.deliveryHours)[0]?.close ?? '18:00',
        },
        address: {
          cep: data.address.cep,
          logradouro: data.address.logradouro,
          numero: data.address.numero,
          complemento: data.address.complemento,
          bairro: data.address.bairro,
          cidade: data.address.cidade,
          estado: data.address.estado,
        },
        termsAccepted: true,
      },
      ipAddress
    )
    userId = user.id

    await recordConsent({ userId, ipAddress, userAgent })

    const supabase = await createSupabaseAdminClient()

    // NOTIF-001: e-mail de verificação para a marmitaria
    await supabase.auth.resend({ type: 'signup', email: data.email })

    // NOTIF-008: notificação de admin via sistema interno
    // TODO: integrar com sistema de push/e-mail quando module-22 (observability) estiver completo
    console.info('[register-marmitaria] NOTIF-008: Nova marmitaria aguardando aprovação', {
      userId,
      tradeName: data.tradeName,
      status: 'PENDING_APPROVAL',
    })

    return { success: true, userId }
  } catch (err) {
    if (userId) {
      const supabase = await createSupabaseAdminClient().catch(() => null)
      if (supabase) await supabase.auth.admin.deleteUser(userId).catch(() => null)
    }
    return sanitizeRegistrationError(err)
  }
}
