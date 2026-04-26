// tests/load/scenarios/login.js
// Cenário: Login — POST /api/v1/auth/login
// Tipo: Autenticação | Alto impacto
// SLO: p95 < 800ms | p99 < 2000ms | erro < 1%
// Auth: Supabase Auth via endpoint customizado
// Rate limit: 5 req / 15 min por e-mail — usar usuário de teste dedicado
// Error codes: AUTH_001 (credenciais inválidas → 401), AUTH_RATE_LIMITED → 429

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const LOAD_TEST_USER = __ENV.LOAD_TEST_USER || 'loadtest@pratosolidario.com.br'
const LOAD_TEST_PASS = __ENV.LOAD_TEST_PASS || 'LoadTest@123'

const errorRate = new Rate('errors')

const SLO_P95 = 800
const SLO_P99 = 2000

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
    },
    // ATENÇÃO: cenário de carga com login em alta concorrência pode acionar rate limiting
    // (5 req / 15 min por e-mail). Para testes de carga real, use VUs distintos com
    // e-mails distintos ou aumente o limite no ambiente de teste.
    average_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 0 },
      ],
      startTime: '1m',
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
  const payload = JSON.stringify({
    email: LOAD_TEST_USER,
    password: LOAD_TEST_PASS,
  })

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
    'login retorna session': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.session !== undefined || body.access_token !== undefined
      } catch {
        return false
      }
    },
    'login latência < SLO p95': (r) => r.timings.duration < SLO_P95,
    'login não retorna 429 (rate limit)': (r) => r.status !== 429,
  })

  // Validar erro esperado em credenciais inválidas (AUTH_001)
  if (res.status === 401) {
    check(res, {
      'login 401 tem código AUTH_001': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.error === 'AUTH_001' || body.code === 'AUTH_001'
        } catch {
          return false
        }
      },
    })
  }

  errorRate.add(!ok)
  sleep(3) // Sleep mais longo para não saturar o rate limit (5 req/15min)
}
