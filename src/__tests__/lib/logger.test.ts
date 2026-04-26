import { describe, it, expect } from 'vitest'
import { createRequestLogger, logger } from '@/lib/logger'

describe('logger', () => {
  it('exporta logger pino com métodos padrão', () => {
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })
})

describe('createRequestLogger', () => {
  it('cria child logger com contexto de request', () => {
    const reqLogger = createRequestLogger('req-123', 'user-abcdefgh-1234', '/api/test')

    // Child logger herda bindings
    const bindings = reqLogger.bindings()
    expect(bindings.requestId).toBe('req-123')
    expect(bindings.userId).toBe('user-abc')  // apenas 8 primeiros chars
    expect(bindings.route).toBe('/api/test')
  })

  it('usa anonymous quando userId não fornecido', () => {
    const reqLogger = createRequestLogger('req-456')
    const bindings = reqLogger.bindings()

    expect(bindings.userId).toBe('anonymous')
    expect(bindings.route).toBe('unknown')
  })

  it('trunca userId para 8 caracteres', () => {
    const reqLogger = createRequestLogger('req-789', '12345678extra')
    expect(reqLogger.bindings().userId).toBe('12345678')
  })
})
