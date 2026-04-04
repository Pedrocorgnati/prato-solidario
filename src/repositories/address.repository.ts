import { prisma } from '@/lib/prisma'
import type { Address, Prisma } from '@prisma/client'

export class AddressRepository {
  async create(data: Prisma.AddressCreateInput): Promise<Address> {
    return prisma.address.create({ data })
  }

  async findByUserId(userId: string): Promise<Address[]> {
    return prisma.address.findMany({ where: { userId } })
  }

  async findById(id: string): Promise<Address | null> {
    return prisma.address.findUnique({ where: { id } })
  }

  async findPrimaryByUserId(userId: string): Promise<Address | null> {
    return prisma.address.findFirst({ where: { userId, isPrimary: true } })
  }

  async update(id: string, data: Prisma.AddressUpdateInput): Promise<Address> {
    return prisma.address.update({ where: { id }, data })
  }

  async updateGeoPoint(id: string, lat: number, lng: number): Promise<Address> {
    return prisma.address.update({ where: { id }, data: { lat, lng } })
  }

  async delete(id: string): Promise<void> {
    await prisma.address.delete({ where: { id } })
  }
}

export const addressRepository = new AddressRepository()
