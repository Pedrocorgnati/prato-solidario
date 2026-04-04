import { z } from 'zod'

export const addressSchema = z.object({
  cep: z.string().length(8, 'CEP deve ter 8 dígitos'),
  logradouro: z.string().min(3).max(255),
  numero: z.string().min(1).max(20),
  complemento: z.string().max(100).optional(),
  bairro: z.string().min(2).max(100),
  cidade: z.string().min(2).max(100),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres (UF)'),
})
export type AddressInput = z.infer<typeof addressSchema>

export const updateAddressSchema = addressSchema.partial()
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>
