import { NextRequest } from 'next/server'
import { geoService } from '@/services/geo.service'
import { errorResponse, GEO_001, GEO_004 } from '@/constants/errors'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cep: string }> }
) {
  const { cep } = await params
  const cleaned = cep.replace(/\D/g, '')

  if (!/^\d{8}$/.test(cleaned)) {
    return errorResponse(GEO_004)
  }

  const result = await geoService.resolveAddress(cleaned)
  if (!result) return errorResponse(GEO_001)

  return Response.json({
    data: {
      cep: result.cep,
      logradouro: result.logradouro,
      complemento: result.complemento,
      bairro: result.bairro,
      cidade: result.localidade,
      estado: result.uf,
    },
  })
}
