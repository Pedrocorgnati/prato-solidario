// tests/load/scenarios/public-metrics.js
// Cenário: Métricas Públicas — GET /api/v1/metrics/public
// Tipo: API leitura pública | Alta frequência (landing page, painel de impacto)
// SLO: p95 < 400ms | p99 < 800ms | erro < 1%
// Sem autenticação — endpoint público de impacto social

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
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

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/metrics/public`, {
    headers: {
      Accept: 'application/json',
    },
  })

  const ok = check(res, {
    'public-metrics status 200': (r) => r.status === 200,
    'public-metrics retorna JSON': (r) => {
      try {
        JSON.parse(r.body)
        return true
      } catch {
        return false
      }
    },
    'public-metrics latência < SLO p95': (r) => r.timings.duration < SLO_P95,
  })

  errorRate.add(!ok)
  sleep(1)
}
