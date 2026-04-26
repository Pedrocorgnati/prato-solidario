import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatória'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  DIRECT_URL: z.string().min(1).optional(),

  // Mapbox (server-side — nunca expor com NEXT_PUBLIC_)
  MAPBOX_ACCESS_TOKEN: z.string().min(1).optional(),

  // Auth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET deve ter ao menos 32 caracteres').optional(),

  // Pagamentos — MercadoPago Connect (OAuth)
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, 'MERCADOPAGO_ACCESS_TOKEN é obrigatória').optional(),
  MP_APP_ID: z.string().min(1, 'MP_APP_ID é obrigatório').optional(),
  MP_CLIENT_SECRET: z.string().min(1, 'MP_CLIENT_SECRET é obrigatório').optional(),
  MP_REDIRECT_URI: z.string().url('MP_REDIRECT_URI deve ser uma URL válida').optional(),
  MP_WEBHOOK_SECRET: z.string().min(1, 'MP_WEBHOOK_SECRET é obrigatório').optional(),
  MP_ENCRYPTION_KEY: z.string().length(64, 'MP_ENCRYPTION_KEY deve ter 64 chars hex (256-bit)').optional(),

  // Mapbox (client-side)
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional(),

  // Push notifications
  EXPO_ACCESS_TOKEN: z.string().min(1).optional(),

  // E-mail
  RESEND_API_KEY: z.string().min(1).optional(),

  // App
  APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL_WWW: z.string().url().optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),

  // Sentry — error tracking
  // SENTRY_DSN: server-side apenas (nunca expor ao browser)
  // NEXT_PUBLIC_SENTRY_DSN: client-side (pode ser público, não contém segredo)
  SENTRY_DSN: z.string().url('SENTRY_DSN deve ser uma URL válida').optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url('NEXT_PUBLIC_SENTRY_DSN deve ser uma URL válida').optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),

  // Cron jobs — protege endpoints internos /api/v1/internal/*
  // Gerar com: openssl rand -hex 32
  // Obrigatório em produção; opcional em desenvolvimento/test
  CRON_SECRET: z.string().min(32, 'CRON_SECRET deve ter ao menos 32 caracteres').optional(),
})

export type Env = z.infer<typeof envSchema>

const _parsed = envSchema.safeParse(process.env)

if (!_parsed.success) {
  const flat = _parsed.error.flatten()
  const missing = Object.entries(flat.fieldErrors)
    .map(([field, msgs]) => `  • ${field}: ${(msgs as string[]).join(', ')}`)
    .join('\n')
  console.error(`\n❌ Variáveis de ambiente inválidas ou ausentes:\n${missing}\n`)
  // Encerra processo apenas em runtime (não durante build/typecheck)
  if (
    typeof window === 'undefined' &&
    process.env.NODE_ENV !== 'test' &&
    process.env.NEXT_PHASE !== 'phase-production-build'
  ) {
    process.exit(1)
  }
}

export const env = (_parsed.success ? _parsed.data : process.env) as Env

// Validação adicional de produção: CRON_SECRET é obrigatório quando NODE_ENV === 'production'
if (
  typeof window === 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PHASE !== 'phase-production-build' &&
  !env.CRON_SECRET
) {
  console.error('\n❌ CRON_SECRET é obrigatório em produção. Gere com: openssl rand -hex 32\n')
  process.exit(1)
}
