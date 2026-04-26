import pino from 'pino'

/**
 * Logger estruturado JSON com:
 *  - niveis: debug | info | warn | error | fatal
 *  - LOG_LEVEL env (default: prod=info, dev=debug)
 *  - campos sempre presentes: level, time (ISO), env, msg, e (opcional) correlationId
 *  - redacao de PII automatica (email, cpf, cnpj, password, tokens)
 *
 * Uso (pino-style, obj primeiro, msg depois):
 *   logger.info({ route: '/api/doacao', userId: '123' }, 'Doação criada')
 *   const reqLogger = createRequestLogger({ correlationId, userId, route })
 *   reqLogger.error({ err }, 'falha ao processar pagamento')
 *
 * @see intake-review/TASK-2/ST003
 */

const PII_SERIALIZERS: Record<string, (v: unknown) => string> = {
  email: () => '[REDACTED_EMAIL]',
  cpf: () => '[REDACTED_CPF]',
  cnpj: () => '[REDACTED_CNPJ]',
  password: () => '[REDACTED]',
  token: () => '[REDACTED_TOKEN]',
  accessToken: () => '[REDACTED_TOKEN]',
  refreshToken: () => '[REDACTED_TOKEN]',
  authorization: () => '[REDACTED_TOKEN]',
}

function resolveLogLevel(): string {
  const raw = process.env.LOG_LEVEL?.trim().toLowerCase()
  if (raw && ['debug', 'info', 'warn', 'error', 'fatal', 'trace', 'silent'].includes(raw)) {
    return raw
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

const currentEnv = process.env.NODE_ENV ?? 'development'

export interface LoggerOptions {
  destination?: pino.DestinationStream
}

/**
 * Cria um logger custom (usado primariamente em testes com destination injetado).
 * Em produção, use o `logger` exportado como default.
 */
export function createLogger(options: LoggerOptions = {}): pino.Logger {
  const opts: pino.LoggerOptions = {
    level: resolveLogLevel(),
    serializers: PII_SERIALIZERS,
    base: { env: currentEnv },
    timestamp: pino.stdTimeFunctions.isoTime,
  }
  // pretty print opt-in via LOG_PRETTY=1 (apenas dev/test, sem destination custom)
  if (!options.destination && currentEnv !== 'production' && process.env.LOG_PRETTY === '1') {
    opts.transport = { target: 'pino-pretty', options: { colorize: true } }
  }
  return options.destination ? pino(opts, options.destination) : pino(opts)
}

export const logger = createLogger()

export interface RequestLoggerContext {
  correlationId: string
  userId?: string | null
  route?: string
}

/**
 * Cria child logger com contexto fixo de request. IDs de usuario sao truncados (8 chars)
 * por privacidade.
 */
export function createRequestLogger(ctx: RequestLoggerContext) {
  return logger.child({
    correlationId: ctx.correlationId,
    userId: ctx.userId ? ctx.userId.slice(0, 8) : 'anonymous',
    route: ctx.route ?? 'unknown',
  })
}

export type Logger = typeof logger
