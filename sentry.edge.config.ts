import * as Sentry from '@sentry/nextjs'
import { redactObject } from '@/lib/constants/pii'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Edge Runtime: sem integrações extras (runtime restrito)
  debug: false,

  beforeSend(event) {
    if (event.extra) {
      event.extra = redactObject(event.extra)
    }
    if (event.user) {
      event.user = redactObject(event.user) as Sentry.User
    }
    if (event.request?.data) {
      event.request.data = redactObject(event.request.data as Record<string, unknown>)
    }
    return event
  },
})
