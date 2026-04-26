export const dynamic = 'force-dynamic'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Acordos de Permuta — Admin | Prato Solidário' }

export default function PermutaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
