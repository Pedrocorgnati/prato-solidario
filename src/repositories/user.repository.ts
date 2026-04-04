import { prisma } from '@/lib/prisma'
import type { User, MarmitariaStatus, Prisma } from '@prisma/client'

export class UserRepository {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data })
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  async findByDocument(document: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { document } })
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data })
  }

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    })
  }

  async findMarmitariasByStatus(status: MarmitariaStatus): Promise<User[]> {
    return prisma.user.findMany({ where: { marmitariaStatus: status, isActive: true } })
  }

  async findAll(params: {
    page: number
    limit: number
    role?: string
    isActive?: boolean
    marmitariaStatus?: MarmitariaStatus
  }): Promise<{ data: User[]; total: number }> {
    const { page, limit, role, isActive, marmitariaStatus } = params
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}
    if (role) where.role = role as User['role']
    if (isActive !== undefined) where.isActive = isActive
    if (marmitariaStatus) where.marmitariaStatus = marmitariaStatus

    const [data, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ])

    return { data, total }
  }
}

export const userRepository = new UserRepository()
