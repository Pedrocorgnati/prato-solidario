// tests/load/scenarios/geo-cep.js
// Cenário: ViaCEP Proxy — GET /api/v1/geo/cep/:cep
// Tipo: Proxy externo (ViaCEP) | Integração crítica (cadastros de endereço)
// SLO: p95 < 800ms | p99 < 2000ms | erro < 2% (SLO permissivo por depender de serviço externo)
// Sem autenticação — usado nos formulários de cadastro de restaurante, marmitaria e ONG
// Error codes: GEO_001 (CEP não encontrado → 404), GEO_002 (ViaCEP indisponível → fallback manual)

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const errorRate = new Rate('errors')

const SLO_P95 = 800
const SLO_P99 = 2000

// CEPs válidos de São Paulo para rotação (piloto MVP)
const CEP_SAMPLES = [
  '01310100', // Av. Paulista
  '01001001', // Praça da Sé
  '04538133', // Av. Brigadeiro Faria Lima
  '05413001', // Pinheiros
  '01310200', // Paraíso
]

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
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      // Carga reduzida — proxy externo com rate limit do ViaCEP
      startTime: '1m',
    },
  },
  thresholds: {
    http_req_duration: [`p(95)<${SLO_P95}`, `p(99)<${SLO_P99}`],
    errors: ['rate<0.02'],
    http_req_failed: ['rate<0.05'],
  },
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: __ENV.SCENARIO || 'default',
  },
}

export default function () {
  // Rotar entre CEPs para simular cadastros distintos
  const cep = CEP_SAMPLES[Math.floor(Math.random() * CEP_SAMPLES.length)]

  const res = http.get(`${BASE_URL}/api/v1/geo/cep/${cep}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  const ok = check(res, {
    'geo-cep status 200 ou 404': (r) => r.status === 200 || r.status === 404,
    'geo-cep latência < SLO p95': (r) => r.timings.duration < SLO_P95,
    'geo-cep retorna JSON': (r) => {
      try {
        JSON.parse(r.body)
        return true
      } catch {
        return false
      }
    },
  })

  // Validar código de erro esperado (GEO_001) em CEP não encontrado
  if (res.status === 404) {
    check(res, {
      'geo-cep 404 tem código GEO_001': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.error === 'GEO_001' || body.code === 'GEO_001'
        } catch {
          return false
        }
      },
    })
  }

  errorRate.add(!ok)
  sleep(2) // Sleep maior para não saturar o ViaCEP
}
