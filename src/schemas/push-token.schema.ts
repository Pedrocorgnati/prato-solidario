import { z } from 'zod'

export const registerPushTokenSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
  deviceId: z.string().min(5, 'Device ID inválido'),
  platform: z.enum(['android', 'ios', 'web']),
  userId: z.string().uuid().optional(),
})
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>
