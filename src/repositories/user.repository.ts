import { prisma } from '@/lib/prisma'
import type { User, MarmitariaStatus, Prisma } from '@prisma/client'

// ---------------------------------------------------------------------------
// TASK-4/ST001 — Account lock functions (AuditLog-based)
// Nota: schema User não possui lockedUntil — bloqueio é rastreado via AuditLog
// ---------------------------------------------------------------------------

const LOCK_THRESHOLD = 5
const LOCK_DURATION_MINUTES = 30
const WINDOW_MINUTES = 15

/**
 * Registra tentativa de login falha e verifica se deve bloquear a conta.
 * Usa emailHash (SHA-256) — nunca e-mail em plain text no log.
 */
export async function incrementFailedAttempts(
  emailHash: string,
  ipAddress?: string
): Promise<{ failedAttempts: number; lockedUntil: Date | null }> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)

  // Registrar tentativa falha
  await prisma.auditLog.create({
    data: {
      action: 'LOGIN_FAILED',
      entityType: 'User',
      metadata: { emailHash } as Prisma.InputJsonValue,
      ipAddress: ipAddress ?? null,
    },
  })

  // Contar falhas recentes na janela de tempo
  const recentAttempts = await prisma.auditLog.count({
    where: {
      action: 'LOGIN_FAILED',
      entityType: 'User',
      createdAt: { gte: windowStart },
      metadata: { path: ['emailHash'], equals: emailHash },
    },
  })

  if (recentAttempts >= LOCK_THRESHOLD) {
    // Verificar se já há um ACCOUNT_LOCKED ativo (evitar duplicatas)
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: 'ACCOUNT_LOCKED',
        entityType: 'User',
        createdAt: { gte: new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000) },
        metadata: { path: ['emailHash'], equals: emailHash },
      },
    })

    const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)

    if (!existing) {
      await prisma.auditLog.create({
        data: {
          action: 'ACCOUNT_LOCKED',
          entityType: 'User',
          metadata: {
            emailHash,
            lockedUntil: lockedUntil.toISOString(),
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      })
    }

    return { failedAttempts: recentAttempts, lockedUntil }
  }

  return { failedAttempts: recentAttempts, lockedUntil: null }
}

/**
 * Verifica se a conta está bloqueada (pelo emailHash SHA-256).
 */
export async function isAccountLocked(
  emailHash: string
): Promise<{ locked: boolean; lockedUntil: Date | null }> {
  const lockEntry = await prisma.auditLog.findFirst({
    where: {
      action: 'ACCOUNT_LOCKED',
      entityType: 'User',
      createdAt: { gte: new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000) },
      metadata: { path: ['emailHash'], equals: emailHash },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!lockEntry) return { locked: false, lockedUntil: null }

  const lockedUntil = new Date(lockEntry.createdAt.getTime() + LOCK_DURATION_MINUTES * 60 * 1000)
  if (lockedUntil <= new Date()) return { locked: false, lockedUntil: null }

  return { locked: true, lockedUntil }
}

/**
 * Marca conta como desbloqueada (login bem-sucedido).
 * Com abordagem AuditLog, o bloqueio expira naturalmente — este log serve para auditoria.
 */
export async function resetFailedAttempts(emailHash: string): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: 'LOGIN_SUCCESS_RESET',
      entityType: 'User',
      metadata: { emailHash } as Prisma.InputJsonValue,
    },
  })
}

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

  /**
   * Marca o e-mail do usuário como verificado.
   * Chamado pelo callback do Supabase Auth após confirmação de e-mail.
   * @see module-5-auth-recovery/TASK-1/ST003
   */
  async verifyEmail(email: string): Promise<void> {
    await prisma.user.updateMany({
      where: { email, emailVerified: false },
      data: { emailVerified: true },
    })
  }
}

export const userRepository = new UserRepository()
