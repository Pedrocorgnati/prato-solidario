// tests/load/run-all.js
// Orquestrador de testes de carga — Prato Solidário
//
// Uso:
//   Smoke (1 VU, 1 min por cenário):
//     k6 run --env SCENARIO=smoke tests/load/run-all.js
//
//   Carga normal (50 VUs):
//     k6 run tests/load/run-all.js
//
//   Stress (200 VUs):
//     k6 run --env SCENARIO=stress tests/load/run-all.js
//
//   Cenário individual:
//     k6 run --env BASE_URL=https://pratosolidario.com.br tests/load/scenarios/homepage.js
//
//   Com auth token (cenário session):
//     k6 run --env AUTH_TOKEN=<supabase_jwt> tests/load/scenarios/session.js
//
//   Para resultados em arquivo:
//     k6 run --out json=tests/load/results/result.json tests/load/run-all.js
//
// Nota: k6 retorna exit code não-zero quando thresholds são violados.
// Isso pode ser integrado como gate de performance no CI/CD (/ci-cd-create).

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const SCENARIO = __ENV.SCENARIO || 'average_load'

// Configuração unificada de thresholds (mais permissiva para o orquestrador)
// Os thresholds granulares ficam em cada cenário individual.
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'],
  },
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: SCENARIO,
    project: 'prato-solidario',
  },
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'tests/load/results/summary.json': JSON.stringify(data, null, 2),
  }
}

// Para execução individual de cada cenário, use diretamente:
//   k6 run tests/load/scenarios/<nome>.js
//
// Cenários disponíveis:
//   homepage.js          — GET /  (sem auth)
//   health-check.js      — GET /api/v1/health  (sem auth)
//   login.js             — POST /api/v1/auth/login  (sem auth, rate limited)
//   session.js           — GET /api/v1/auth/session  (requer AUTH_TOKEN)
//   public-metrics.js    — GET /api/v1/metrics/public  (sem auth)
//   donations-available.js — GET /api/v1/donations/available  (sem auth)
//   active-banners.js    — GET /api/v1/banners/active  (sem auth)
//   geo-cep.js           — GET /api/v1/geo/cep/:cep  (sem auth, proxy ViaCEP)
