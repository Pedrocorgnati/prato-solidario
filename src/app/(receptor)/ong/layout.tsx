export const dynamic = 'force-dynamic'
/**
 * ONG Layout — Server Component com role guard.
 * Redireciona para /acesso-negado se não autenticado ou role != ONG.
 * @see module-10-codigos-historico/TASK-6/ST001
 */

import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getServerSession } from "@/lib/auth/session"
import { ROUTES } from "@/lib/constants"

export default async function OngLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  if (!session || (session.role as string) !== "ONG") {
    redirect("/acesso-negado")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-[var(--color-border-raw)] px-4">
        <Link href={ROUTES.HOME}>
          {/* @ASSET_PLACEHOLDER
          name: logo-prato-solidario
          type: image
          extension: png
          dimensions: 120x28
          description: Logo Prato Solidário header ONG
          */}
          <Image
            src="/images/logo-prato-solidario.png"
            alt="Prato Solidário"
            width={120}
            height={28}
            className="h-7 w-auto"
          />
        </Link>
        <span className="rounded-full bg-[var(--color-info)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-info)]">
          ONG
        </span>
      </header>
      <main id="main" className="flex-1 pb-6">
        {children}
      </main>
    </div>
  )
}
