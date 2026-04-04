import Image from "next/image"
import Link from "next/link"
import { ROUTES, UserRole } from "@/lib/constants"
import { BottomNav } from "@/components/shared/bottom-nav"
import { Button } from "@/components/ui/button"

export default function ReceptorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-[var(--color-border-raw)] px-4">
        <Link href={ROUTES.HOME}>
          {/* @ASSET_PLACEHOLDER
          name: logo-prato-solidario
          type: image
          extension: png
          dimensions: 120x28
          description: Logo Prato Solidário header receptor
          */}
          <Image
            src="/images/logo-prato-solidario.png"
            alt="Prato Solidário"
            width={120}
            height={28}
            className="h-7 w-auto"
          />
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.LOGIN}>Sair</Link>
        </Button>
      </header>
      <main id="main" className="flex-1 pb-20">
        {children}
      </main>
      <BottomNav role={UserRole.RECEPTOR} />
    </div>
  )
}
