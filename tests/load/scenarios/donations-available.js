// tests/load/scenarios/donations-available.js
// Cenário: Doações Disponíveis — GET /api/v1/donations/available
// Tipo: API leitura pública | Alta frequência (receptor buscando refeições)
// SLO: p95 < 400ms | p99 < 800ms | erro < 1%
// Sem autenticação — endpoint público principal do Rock 1

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
  // Simular receptor buscando doações próximas com filtro de localização (São Paulo — piloto)
  const params = new URLSearchParams({
    lat: '-23.5505',
    lng: '-46.6333',
    radius: '5',
  })

  const res = http.get(`${BASE_URL}/api/v1/donations/available?${params}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  const ok = check(res, {
    'donations-available status 200': (r) => r.status === 200,
    'donations-available retorna array': (r) => {
      try {
        const body = JSON.parse(r.body)
        return Array.isArray(body) || Array.isArray(body?.data)
      } catch {
        return false
      }
    },
    'donations-available latência < SLO p95': (r) => r.timings.duration < SLO_P95,
  })

  errorRate.add(!ok)
  sleep(1)
}
