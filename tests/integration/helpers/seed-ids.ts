/**
 * IDs fixos dos anchor records do seed (ver SEED-CATALOG.md)
 * Devem existir no banco de teste após `npm run db:seed`.
 */

export const UID = {
  admin:        'a0000000-0000-0000-0000-000000000001',
  doadorPf:     'a0000000-0000-0000-0000-000000000002',
  doadorRest:   'a0000000-0000-0000-0000-000000000003',
  marmAtiva:    'a0000000-0000-0000-0000-000000000004',
  receptor:     'a0000000-0000-0000-0000-000000000005',
  ong:          'a0000000-0000-0000-0000-000000000006',
  patrocinador: 'a0000000-0000-0000-0000-000000000007',
  recBlocked:   'a0000000-0000-0000-0000-000000000008',
  marmPending:  'a0000000-0000-0000-0000-000000000009',
  marmSusp:     'a0000000-0000-0000-0000-000000000010',
  marmInativa:  'a0000000-0000-0000-0000-000000000011',
} as const

export const DID = {
  pending:    'd0000000-0000-0000-0001-000000000001',
  available:  'd0000000-0000-0000-0001-000000000002',
  reserved:   'd0000000-0000-0000-0001-000000000003',
  completed:  'd0000000-0000-0000-0001-000000000004',
  expired:    'd0000000-0000-0000-0001-000000000005',
  cancelled:  'd0000000-0000-0000-0001-000000000006',
} as const

// Tokens de teste — strings arbitrárias mapeadas pelo mock de auth
export const TEST_TOKENS = {
  admin:        'int-test-token-admin',
  doadorPf:     'int-test-token-doador-pf',
  doadorRest:   'int-test-token-doador-rest',
  marmAtiva:    'int-test-token-marm-ativa',
  receptor:     'int-test-token-receptor',
  ong:          'int-test-token-ong',
  patrocinador: 'int-test-token-patrocinador',
} as const
