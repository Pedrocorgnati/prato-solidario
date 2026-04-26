/**
 * POST /api/v1/donations/:id/cancel — Cancelar doação
 * @see module-8-doacao-form/TASK-4/ST004
 */

import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { donationService } from '@/services/donation.service'
import { notificationService } from '@/services/notification.service'
import { toApiError } from '@/lib/api-error'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireSession()
    const donation = await donationService.cancelDonation(id, session.id)

    // Notificar receptores com reserva ativa (best-effort, em background)
    notificationService.notifyReservationCancelled(id).catch((err) =>
      console.warn('[cancelDonation] Erro ao notificar receptores:', err)
    )

    return NextResponse.json({ data: { cancelled: true, donation } })
  } catch (err) {
    return toApiError(err)
  }
}
