/**
 * Logger tests — intake-review TASK-2/ST003
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Writable } from 'node:stream'

async function loadLogger() {
  // Re-importar apos mutacao de env para reavaliar LOG_LEVEL
  const mod = await import('./logger?t=' + Date.now())
  return mod as typeof import('./logger')
}

function collect(): { stream: Writable; getLines: () => string[] } {
  const chunks: string[] = []
  const stream = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk.toString())
      cb()
    },
  })
  return {
    stream,
    getLines: () =>
      chunks
        .join('')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
  }
}

describe('logger', () => {
  const OLD = { ...process.env }

  beforeEach(() => {
    delete process.env.LOG_LEVEL
    delete process.env.LOG_PRETTY
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
  })
  afterEach(() => {
    Object.assign(process.env, OLD)
  })

  it('emits JSON with required fields', async () => {
    const { createLogger } = await loadLogger()
    const sink = collect()
    const logger = createLogger({ destination: sink.stream })
    logger.info({ userId: '1' }, 'hello')
    const parsed = JSON.parse(sink.getLines().pop()!)
    expect(parsed).toMatchObject({
      level: 30,
      msg: 'hello',
      userId: '1',
      env: 'test',
    })
    expect(parsed.time).toBeTypeOf('string')
  })

  it('redacts PII fields via serializers', async () => {
    const { createLogger } = await loadLogger()
    const sink = collect()
    const logger = createLogger({ destination: sink.stream })
    logger.info({ email: 'x@y.com', cpf: '12345678900', password: 'hunter2' }, 'pii')
    const parsed = JSON.parse(sink.getLines().pop()!)
    expect(parsed.email).toBe('[REDACTED_EMAIL]')
    expect(parsed.cpf).toBe('[REDACTED_CPF]')
    expect(parsed.password).toBe('[REDACTED]')
  })

  it('respects LOG_LEVEL env var', async () => {
    process.env.LOG_LEVEL = 'warn'
    const { createLogger } = await loadLogger()
    const sink = collect()
    const logger = createLogger({ destination: sink.stream })
    logger.info({}, 'should-be-filtered')
    logger.warn({}, 'should-emit')
    const out = sink.getLines().join('\n')
    expect(out).not.toContain('should-be-filtered')
    expect(out).toContain('should-emit')
  })

  it('createRequestLogger inherits correlationId / userId / route', async () => {
    const { createLogger } = await loadLogger()
    const sink = collect()
    const logger = createLogger({ destination: sink.stream })
    const child = logger.child({
      correlationId: 'req-123',
      userId: 'abcdef01',
      route: '/api/v1/test',
    })
    child.info({}, 'ctx-test')
    const parsed = JSON.parse(sink.getLines().pop()!)
    expect(parsed).toMatchObject({
      correlationId: 'req-123',
      userId: 'abcdef01',
      route: '/api/v1/test',
      msg: 'ctx-test',
    })
  })

  it('createRequestLogger helper truncates userId to 8 and defaults route', async () => {
    const { createRequestLogger } = await loadLogger()
    const child = createRequestLogger({
      correlationId: 'req-y',
      userId: 'abcdef01-long',
    })
    expect(child.bindings()).toMatchObject({
      correlationId: 'req-y',
      userId: 'abcdef01',
      route: 'unknown',
    })
  })
})
