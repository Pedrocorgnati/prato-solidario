import { userRepository } from '@/repositories/user.repository'
import { addressRepository } from '@/repositories/address.repository'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import { geoService } from '@/services/geo.service'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import type { User, Address } from '@prisma/client'
import type {
  CreateDonorPFInput,
  CreateDonorRestaurantInput,
  CreateMarmitariaInput,
  CreateONGInput,
  CreateReceptorInput,
  CreateSponsorInput,
  UpdateUserInput,
} from '@/schemas/user.schema'

export interface UserExport {
  user: User
  addresses: Address[]
  exportedAt: string
}

export class UserService {
  private async createAuthUser(email: string, password: string, role: string): Promise<string> {
    const supabase = await createSupabaseAdminClient()
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role },
      email_confirm: false,
    })
    if (error) throw new Error(error.message)
    return data.user.id
  }

  async createDonorPF(dto: CreateDonorPFInput, ipAddress?: string): Promise<User> {
    const authId = await this.createAuthUser(dto.email, dto.password, 'DOADOR_PF')
    const now = new Date()
    const user = await userRepository.create({
      id: authId,
      email: dto.email,
      role: 'DOADOR_PF',
      name: dto.name,
      phone: dto.phone,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: '1.0',
    })
    await auditLogRepository.log('USER_CREATED', 'User', {
      userId: user.id,
      entityId: user.id,
      metadata: { role: 'DOADOR_PF' },
      ipAddress,
    })
    return user
  }

  async createDonorRestaurant(dto: CreateDonorRestaurantInput, ipAddress?: string): Promise<User> {
    const authId = await this.createAuthUser(dto.email, dto.password, 'DOADOR_RESTAURANTE')
    const now = new Date()
    const user = await userRepository.create({
      id: authId,
      email: dto.email,
      role: 'DOADOR_RESTAURANTE',
      name: dto.name,
      phone: dto.phone,
      document: dto.document.replace(/\D/g, ''),
      documentType: dto.document.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ',
      photoUrl: dto.photoUrl ?? null,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: '1.0',
    })

    const address = await addressRepository.create({
      user: { connect: { id: user.id } },
      ...dto.address,
      cep: dto.address.cep.replace(/\D/g, ''),
    })

    // Geocoding assíncrono (não bloqueia resposta)
    const fullAddress = `${dto.address.logradouro}, ${dto.address.numero}, ${dto.address.bairro}, ${dto.address.cidade}, ${dto.address.estado}`
    geoService.geocode(fullAddress).then((geo) => {
      if (geo) addressRepository.updateGeoPoint(address.id, geo.lat, geo.lng)
    })

    await auditLogRepository.log('USER_CREATED', 'User', {
      userId: user.id,
      entityId: user.id,
      metadata: { role: 'DOADOR_RESTAURANTE' },
      ipAddress,
    })
    return user
  }

  async createMarmitaria(dto: CreateMarmitariaInput, ipAddress?: string): Promise<User> {
    const authId = await this.createAuthUser(dto.email, dto.password, 'MARMITARIA')
    const now = new Date()
    const user = await userRepository.create({
      id: authId,
      email: dto.email,
      role: 'MARMITARIA',
      name: dto.name,
      phone: dto.phone,
      document: dto.document.replace(/\D/g, ''),
      documentType: dto.document.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ',
      photoUrl: dto.photoUrl,
      marmitariaStatus: 'PENDING_APPROVAL',
      marmitariaPrice: dto.price,
      marmitariaSchedule: dto.schedule,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: '1.0',
    })

    const address = await addressRepository.create({
      user: { connect: { id: user.id } },
      ...dto.address,
      cep: dto.address.cep.replace(/\D/g, ''),
    })

    geoService.geocode(`${dto.address.logradouro}, ${dto.address.numero}, ${dto.address.bairro}, ${dto.address.cidade}`).then((geo) => {
      if (geo) addressRepository.updateGeoPoint(address.id, geo.lat, geo.lng)
    })

    await auditLogRepository.log('USER_CREATED', 'User', {
      userId: user.id,
      entityId: user.id,
      metadata: { role: 'MARMITARIA', marmitariaStatus: 'PENDING_APPROVAL' },
      ipAddress,
    })
    return user
  }

  async createONG(dto: CreateONGInput, ipAddress?: string): Promise<User> {
    const authId = await this.createAuthUser(dto.email, dto.password, 'ONG')
    const now = new Date()
    const user = await userRepository.create({
      id: authId,
      email: dto.email,
      role: 'ONG',
      name: dto.name,
      document: dto.document.replace(/\D/g, ''),
      documentType: dto.document.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ',
      isRedistributor: true,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: '1.0',
    })
    await auditLogRepository.log('USER_CREATED', 'User', {
      userId: user.id,
      entityId: user.id,
      metadata: { role: 'ONG' },
      ipAddress,
    })
    return user
  }

  async createReceptor(dto: CreateReceptorInput, ipAddress?: string): Promise<User> {
    const authId = await this.createAuthUser(dto.email, dto.password, 'RECEPTOR')
    const now = new Date()
    const user = await userRepository.create({
      id: authId,
      email: dto.email,
      role: 'RECEPTOR',
      name: dto.email.split('@')[0],
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: '1.0',
    })
    await auditLogRepository.log('USER_CREATED', 'User', {
      userId: user.id,
      entityId: user.id,
      metadata: { role: 'RECEPTOR' },
      ipAddress,
    })
    return user
  }

  async createSponsor(dto: CreateSponsorInput, ipAddress?: string): Promise<User> {
    const authId = await this.createAuthUser(dto.email, dto.password, 'PATROCINADOR')
    const now = new Date()
    const user = await userRepository.create({
      id: authId,
      email: dto.email,
      role: 'PATROCINADOR',
      name: dto.name,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: '1.0',
    })
    await auditLogRepository.log('USER_CREATED', 'User', {
      userId: user.id,
      entityId: user.id,
      metadata: { role: 'PATROCINADOR' },
      ipAddress,
    })
    return user
  }

  async getUserById(id: string): Promise<User | null> {
    return userRepository.findById(id)
  }

  async updateUser(id: string, data: UpdateUserInput, ipAddress?: string): Promise<User> {
    const user = await userRepository.update(id, data)
    await auditLogRepository.log('USER_UPDATED', 'User', { userId: id, entityId: id, ipAddress })
    return user
  }

  async requestDeletion(userId: string, ipAddress?: string): Promise<void> {
    await userRepository.update(userId, { deletedAt: new Date() })
    await auditLogRepository.log('USER_DELETION_REQUESTED', 'User', {
      userId,
      entityId: userId,
      ipAddress,
    })
  }

  async exportUserData(userId: string): Promise<UserExport> {
    const user = await userRepository.findById(userId)
    if (!user) throw new Error('USER_NOT_FOUND')
    const addresses = await addressRepository.findByUserId(userId)
    return { user, addresses, exportedAt: new Date().toISOString() }
  }
}

export const userService = new UserService()
