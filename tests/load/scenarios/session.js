// tests/load/scenarios/session.js
// Cenário: Session — GET /api/v1/auth/session
// Tipo: API leitura autenticada | Alta frequência (verificação de sessão contínua)
// SLO: p95 < 400ms | p99 < 800ms | erro < 1%
// Auth: Bearer token obtido via variável de ambiente AUTH_TOKEN
// Uso: k6 run --env AUTH_TOKEN=<token> tests/load/scenarios/session.js

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''

const errorRate = new Rate('errors')

const SLO_P95 = 400
const SLO_P99 = 800

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
    },
    average_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      startTime: '1m',
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
      ],
      startTime: '10m',
    },
  },
  thresholds: {
    http_req_duration: [`p(95)<${SLO_P95}`, `p(99)<${SLO_P99}`],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.05'],
  },
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: __ENV.SCENARIO || 'default',
  },
}

export function setup() {
  if (!AUTH_TOKEN) {
    console.warn(
      '[session] AUTH_TOKEN não fornecido. Cenário retornará 401. ' +
        'Forneça via: k6 run --env AUTH_TOKEN=<supabase_jwt> tests/load/scenarios/session.js'
    )
  }
}

export default function () {
  const headers = {
    Accept: 'application/json',
  }

  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`
  }

  const res = http.get(`${BASE_URL}/api/v1/auth/session`, { headers })

  const ok = check(res, {
    'session status 200': (r) => r.status === 200,
    'session retorna user': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.user !== undefined
      } catch {
        return false
      }
    },
    'session latência < SLO p95': (r) => r.timings.duration < SLO_P95,
  })

  errorRate.add(!ok)
  sleep(1)
}
