import { z } from 'zod'
import { addressSchema } from './address.schema'
import { isValidCpf } from '@/validators/cpf'
import { isValidCnpj } from '@/validators/cnpj'

const documentSchema = z.string().refine(
  (v) => isValidCpf(v.replace(/\D/g, '')) || isValidCnpj(v.replace(/\D/g, '')),
  'Documento inválido. Verifique os números.'
)

const phoneSchema = z.string().regex(/^\+55\d{10,11}$/, 'Telefone inválido (use +55 + DDD + número)')
const passwordSchema = z.string().min(8, 'Senha deve ter no mínimo 8 caracteres')

export const createDonorPFSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
  email: z.string().email('E-mail inválido'),
  password: passwordSchema,
  phone: phoneSchema,
  termsAccepted: z.literal(true, {
    error: 'Aceite os termos para continuar',
  }),
})
export type CreateDonorPFInput = z.infer<typeof createDonorPFSchema>

export const createDonorRestaurantSchema = z.object({
  establishmentType: z.enum(['restaurante', 'lanchonete', 'catering', 'padaria', 'outro']),
  name: z.string().min(2).max(255),
  document: documentSchema,
  phone: phoneSchema,
  email: z.string().email('E-mail inválido'),
  password: passwordSchema,
  address: addressSchema,
  photoUrl: z.string().url().optional(),
  termsAccepted: z.literal(true, {
    error: 'Aceite os termos para continuar',
  }),
})
export type CreateDonorRestaurantInput = z.infer<typeof createDonorRestaurantSchema>

export const createMarmitariaSchema = z.object({
  name: z.string().min(2).max(255),
  document: documentSchema,
  phone: phoneSchema,
  email: z.string().email('E-mail inválido'),
  password: passwordSchema,
  address: addressSchema,
  photoUrl: z.string().url('Foto obrigatória para marmitarias'),
  price: z.number().positive('Valor mínimo R$ 0,01').max(999.99),
  schedule: z.object({
    days: z
      .array(z.enum(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']))
      .min(1, 'Selecione ao menos um dia'),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  }),
  termsAccepted: z.literal(true, {
    error: 'Aceite os termos para continuar',
  }),
})
export type CreateMarmitariaInput = z.infer<typeof createMarmitariaSchema>

export const createONGSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email('E-mail inválido'),
  password: passwordSchema,
  document: documentSchema,
  termsAccepted: z.literal(true, {
    error: 'Aceite os termos para continuar',
  }),
})
export type CreateONGInput = z.infer<typeof createONGSchema>

export const createReceptorSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: passwordSchema,
  location: z.string().min(5, 'Informe CEP ou bairro'),
})
export type CreateReceptorInput = z.infer<typeof createReceptorSchema>

export const createSponsorSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email('E-mail inválido'),
  password: passwordSchema,
})
export type CreateSponsorInput = z.infer<typeof createSponsorSchema>

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  phone: phoneSchema.optional(),
  photoUrl: z.string().url().optional(),
})
export type UpdateUserInput = z.infer<typeof updateUserSchema>
