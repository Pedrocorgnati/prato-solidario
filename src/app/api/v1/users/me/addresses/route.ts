import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { addressRepository } from '@/repositories/address.repository'
import { geoService } from '@/services/geo.service'
import { addressSchema } from '@/schemas/address.schema'
import { errorResponse, AUTH_007, SYS_001 } from '@/constants/errors'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  try {
    const data = await addressRepository.findByUserId(auth.userId)
    return Response.json({ data, pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 } })
  } catch {
    return errorResponse(SYS_001)
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = addressSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    const address = await addressRepository.create({
      user: { connect: { id: auth.userId } },
      ...parsed.data,
      cep: parsed.data.cep.replace(/\D/g, ''),
    })

    const fullAddress = `${parsed.data.logradouro}, ${parsed.data.numero}, ${parsed.data.bairro}, ${parsed.data.cidade}, ${parsed.data.estado}`
    geoService.geocode(fullAddress).then((geo) => {
      if (geo) addressRepository.updateGeoPoint(address.id, geo.lat, geo.lng)
    })

    return Response.json({ data: address }, { status: 201 })
  } catch {
    return errorResponse(SYS_001)
  }
}
