import { z } from 'zod'

/**
 * Tipos e schemas Zod v4 para cadastro multi-perfil.
 * @see module-4-auth-register/TASK-0/ST002
 */

// ---------------------------------------------------------------------------
// Resultado genérico de cadastro
// ---------------------------------------------------------------------------

export interface RegisterResult {
  success: boolean
  userId?: string
  error?: string
}

export interface MultiStepFormState<T> {
  currentStep: number
  totalSteps: number
  data: Partial<T>
  isValid: boolean
}

// ---------------------------------------------------------------------------
// Endereço BR (compartilhado)
// ---------------------------------------------------------------------------

const addressSchema = z.object({
  cep: z.string().min(8, 'CEP é obrigatório'),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'UF inválida (ex: SP)'),
})

export type AddressBrInput = z.infer<typeof addressSchema>
export { addressSchema }

// ---------------------------------------------------------------------------
// Doador Pessoa Física (3 etapas)
// @see INT-008, INT-016, INT-103
// ---------------------------------------------------------------------------

export const registerDoadorPfSchema = z.object({
  name: z.string().min(1, 'Nome completo é obrigatório'),
  cpf: z.string().length(11, 'CPF inválido'),
  birthDate: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  phone: z.string().optional(),
  address: addressSchema,
  photoUrl: z.string().optional(),
  newsletter: z.boolean().optional(),
})
export type RegisterDoadorPfDTO = z.infer<typeof registerDoadorPfSchema>

// ---------------------------------------------------------------------------
// Doador Restaurante (5 etapas)
// @see INT-009, INT-024, INT-104
// ---------------------------------------------------------------------------

const businessHourEntrySchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (HH:MM)'),
  close: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (HH:MM)'),
})

export const registerRestauranteSchema = z.object({
  responsavelName: z.string().min(1, 'Nome do responsável é obrigatório'),
  cpf: z.string().length(11, 'CPF do responsável inválido'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  tradeName: z.string().min(1, 'Nome do restaurante é obrigatório'),
  cnpj: z.string().length(14, 'CNPJ inválido (14 dígitos)'),
  cuisineType: z.string().min(1, 'Tipo de cozinha é obrigatório'),
  phone: z.string().optional(),
  logoUrl: z.string().optional(),
  address: addressSchema,
  businessDays: z.array(z.number().int().min(0).max(6)).min(1, 'Selecione ao menos um dia de funcionamento'),
  businessHours: z.record(z.string(), businessHourEntrySchema),
  averagePortions: z.number().int().min(1).optional(),
  preferredWindow: z.enum(['manha', 'tarde', 'noite']).optional(),
})
export type RegisterRestauranteDTO = z.infer<typeof registerRestauranteSchema>

// ---------------------------------------------------------------------------
// ONG (3 etapas)
// @see INT-012, INT-013, INT-047, INT-106
// ---------------------------------------------------------------------------

export const registerOngSchema = z.object({
  representativeName: z.string().min(1, 'Nome do representante é obrigatório'),
  representativeCpf: z.string().length(11, 'CPF do representante inválido'),
  representativeRole: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
  cnpj: z.string().length(14, 'CNPJ inválido (14 dígitos)'),
  address: addressSchema,
  atuacao: z.array(z.string()).min(1, 'Selecione ao menos uma área de atuação'),
  logoUrl: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  legalDeclaration: z.literal(true, {
    error: 'É necessário confirmar a regularidade da ONG',
  }),
})
export type RegisterOngDTO = z.infer<typeof registerOngSchema>

// ---------------------------------------------------------------------------
// Marmitaria (6 etapas)
// @see INT-015, INT-096, INT-097, INT-105
// ---------------------------------------------------------------------------

export const registerMarmitariaSchema = z.object({
  responsavelName: z.string().min(1, 'Nome do responsável é obrigatório'),
  cpf: z.string().length(11, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  tradeName: z.string().min(1, 'Nome da marmitaria é obrigatório'),
  cnpj: z.string().length(14, 'CNPJ inválido (14 dígitos)').optional().or(z.literal('')),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  address: addressSchema,
  deliveryRadiusKm: z.number().min(1).max(10).optional(),
  dailyCapacity: z.number().int().min(10, 'Capacidade mínima é de 10 marmitas por dia'),
  mealTypes: z.array(z.string()).min(1, 'Selecione ao menos um tipo de refeição'),
  pricePerMeal: z.number().positive().optional(),
  deliveryDays: z.array(z.number().int().min(0).max(6)).min(1, 'Selecione ao menos um dia de funcionamento'),
  deliveryHours: z.record(z.string(), businessHourEntrySchema),
  orderDeadline: z.string().min(1, 'Prazo para pedido é obrigatório'),
  scheduleNote: z.string().max(200).optional(),
})
export type RegisterMarmitariaDTO = z.infer<typeof registerMarmitariaSchema>

// ---------------------------------------------------------------------------
// Patrocinador (2 etapas — Should)
// @see INT-014, INT-108
// ---------------------------------------------------------------------------

export const registerPatrocinadorSchema = z.object({
  name: z.string().min(1, 'Nome ou razão social é obrigatório'),
  sponsorType: z.enum(['PF', 'EMPRESA']),
  cpf: z.string().length(11, 'CPF inválido').optional(),
  cnpj: z.string().length(14, 'CNPJ inválido').optional(),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})
export type RegisterPatrocinadorDTO = z.infer<typeof registerPatrocinadorSchema>

// ---------------------------------------------------------------------------
// Receptor (cadastro opcional — Should)
// @see INT-107, INT-034
// ---------------------------------------------------------------------------

export const registerReceptorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  cep: z.string().optional(),
})
export type RegisterReceptorDTO = z.infer<typeof registerReceptorSchema>
