import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-8xl font-extrabold text-[var(--color-primary-raw)]">404</h1>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Página não encontrada
        </h2>
        <p className="text-[var(--color-text-secondary)]">
          A página que você está procurando não existe ou foi removida.
        </p>
      </div>
      <Button variant="default" size="lg" asChild>
        <Link href={ROUTES.HOME}>Voltar ao início</Link>
      </Button>
    </div>
  )
}
