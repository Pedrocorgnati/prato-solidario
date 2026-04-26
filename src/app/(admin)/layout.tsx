export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { AdminLayout } from "@/components/shared/admin-layout"
import { requireRole } from "@/lib/auth/session"
import { adminTwoFactorService } from "@/services/admin-2fa.service"
import { isTwoFactorVerified } from "@/lib/auth/two-factor"

// TASK-2 / CL-265 — 2FA guard para admins.
// As paginas /2fa-enroll e /2fa-verify vivem FORA do grupo (admin),
// portanto nao passam por este layout (evita loop).

export default async function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(['ADMIN'])
  const enrolled = await adminTwoFactorService.isEnrolled(user.id)
  if (!enrolled) {
    redirect('/2fa-enroll?next=/admin')
  }
  const verified = await isTwoFactorVerified(user.id)
  if (!verified) {
    redirect('/2fa-verify?next=/admin')
  }
  return <AdminLayout>{children}</AdminLayout>
}
