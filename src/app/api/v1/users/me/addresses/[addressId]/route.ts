import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { addressRepository } from '@/repositories/address.repository'
import { addressSchema } from '@/schemas/address.schema'
import { errorResponse, AUTH_007, AUTH_008, SYS_001 } from '@/constants/errors'

const NOT_FOUND = { code: 'ADDRESS_NOT_FOUND', status: 404, message: 'Endereço não encontrado.' }

async function resolveAddressOwnership(token: string, addressId: string) {
  const auth = await authService.getSessionFromToken(token)
  if (!auth) return { auth: null, address: null }
  const address = await addressRepository.findById(addressId)
  if (!address) return { auth, address: null }
  if (address.userId !== auth.userId) return { auth, address: null, forbidden: true }
  return { auth, address }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const { addressId } = await params
  const { auth, address, forbidden } = await resolveAddressOwnership(token, addressId)
  if (!auth) return errorResponse(AUTH_007)
  if (forbidden) return errorResponse(AUTH_008)
  if (!address) return errorResponse(NOT_FOUND)

  return Response.json({ data: address })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const { addressId } = await params
  const { auth, address, forbidden } = await resolveAddressOwnership(token, addressId)
  if (!auth) return errorResponse(AUTH_007)
  if (forbidden) return errorResponse(AUTH_008)
  if (!address) return errorResponse(NOT_FOUND)

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
    const updated = await addressRepository.update(addressId, {
      ...parsed.data,
      cep: parsed.data.cep.replace(/\D/g, ''),
    })
    return Response.json({ data: updated })
  } catch {
    return errorResponse(SYS_001)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const { addressId } = await params
  const { auth, address, forbidden } = await resolveAddressOwnership(token, addressId)
  if (!auth) return errorResponse(AUTH_007)
  if (forbidden) return errorResponse(AUTH_008)
  if (!address) return errorResponse(NOT_FOUND)

  try {
    await addressRepository.delete(addressId)
    return new Response(null, { status: 204 })
  } catch {
    return errorResponse(SYS_001)
  }
}
