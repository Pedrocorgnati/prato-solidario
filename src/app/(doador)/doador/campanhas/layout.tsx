export const dynamic = 'force-dynamic'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Campanhas de Banner | Prato Solidário' }

export default function CampanhasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
