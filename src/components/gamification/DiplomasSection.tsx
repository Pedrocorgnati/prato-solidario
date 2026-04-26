/**
 * DiplomasSection — Server Component que carrega anos com diploma e renderiza DiplomasClient.
 * Importado via Suspense na página de conquistas.
 *
 * @see module-20-gamificacao/TASK-4/ST003
 */

import { diplomaService } from '@/services/diploma.service'
import { DiplomasClient } from './DiplomasClient'

export async function DiplomasSection({ userId }: { userId: string }) {
  const availableYears = await diplomaService.getDiplomaYearsForUser(userId)
  const currentYear = new Date().getFullYear()

  return (
    <DiplomasClient
      availableYears={availableYears}
      currentYear={currentYear}
    />
  )
}
