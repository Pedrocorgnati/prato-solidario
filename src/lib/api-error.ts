/**
 * Utilitário de mapeamento de erros para respostas padronizadas da API.
 * Todos os erros retornam { error: { code, message } } — nenhuma stack trace exposta.
 * @see module-8-doacao-form/TASK-2/ST006
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import {
  GeocodingError,
  DonationValidationError,
  DonationOwnershipError,
  DonationNotFoundError,
  DonationStatusError,
} from '@/services/donation.service'

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    fields?: Record<string, string[]>
  }
}

/**
 * Converte qualquer erro em uma NextResponse padronizada.
 * Segue o ERROR-CATALOG do projeto.
 */
export function toApiError(err: unknown): NextResponse<ApiErrorResponse> {
  // Erros de validação Zod
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: { code: 'VAL_001', message: 'Dados inválidos.', fields: err.flatten().fieldErrors as Record<string, string[]> } },
      { status: 400 }
    )
  }

  // Erros de validação de negócio (janela, quantidade)
  if (err instanceof DonationValidationError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: 400 }
    )
  }

  // Erros de geocoding (Mapbox + ViaCEP falharam)
  if (err instanceof GeocodingError) {
    return NextResponse.json(
      { error: { code: 'GEO_001', message: 'Endereço não pôde ser localizado. Verifique o CEP e tente novamente.' } },
      { status: 503 }
    )
  }

  // Ownership inválido (AUTH_005)
  if (err instanceof DonationOwnershipError) {
    return NextResponse.json(
      { error: { code: 'AUTH_005', message: err.message } },
      { status: 403 }
    )
  }

  // Recurso não encontrado
  if (err instanceof DonationNotFoundError) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: err.message } },
      { status: 404 }
    )
  }

  // Status inválido para a operação
  if (err instanceof DonationStatusError) {
    return NextResponse.json(
      { error: { code: 'SYS_001', message: err.message } },
      { status: 422 }
    )
  }

  // Erro não mapeado — logar no servidor, não expor detalhes ao cliente
  console.error('[API] Erro não tratado:', err)
  return NextResponse.json(
    { error: { code: 'SYS_001', message: 'Ocorreu um erro inesperado. Nossa equipe foi notificada.' } },
    { status: 500 }
  )
}
