export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession, getLoginRedirect } from '@/lib/auth/session'
import { AuthLayout } from '@/components/shared/auth-layout'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Entrar — Prato Solidario',
  robots: { index: false },
}

/**
 * Server Component — pagina de login.
 * Verifica sessao: se autenticado, redireciona para area do role.
 * @see module-3-auth-login/TASK-1/ST007, TASK-7 (correcao pos-auditoria)
 */
export default async function LoginPage() {
  // Se ja autenticado, redireciona para dashboard do role
  const user = await getServerSession()
  if (user) {
    redirect(getLoginRedirect(user.role as string))
  }

  return (
    <AuthLayout
      title="Entrar na conta"
      subtitle="Transforme seu excedente em solidariedade"
    >
      <LoginForm />
    </AuthLayout>
  )
}
