/**
 * Factories de payload — geram dados únicos por execução.
 * Usar TEST_EMAIL_DOMAIN para que o afterAll do setup limpe automaticamente.
 */

import { TEST_EMAIL_DOMAIN } from '../setup'

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function buildDonorPFPayload(overrides: Record<string, unknown> = {}) {
  const tag = uid('doador')
  return {
    name: `Teste Integration ${tag}`,
    email: `${tag}${TEST_EMAIL_DOMAIN}`,
    password: 'Senha@Segura123',
    phone: '+5511999990001',
    document: '529.982.247-25', // CPF válido (dígitos verificadores ok)
    termsAccepted: true,
    privacyAccepted: true,
    ...overrides,
  }
}

export function buildDonorRestaurantPayload(overrides: Record<string, unknown> = {}) {
  const tag = uid('rest')
  return {
    name: `Proprietário ${tag}`,
    email: `${tag}${TEST_EMAIL_DOMAIN}`,
    password: 'Senha@Segura123',
    phone: '+5511999990002',
    document: '11.222.333/0001-81', // CNPJ válido
    tradeName: `Restaurante ${tag}`,
    termsAccepted: true,
    privacyAccepted: true,
    ...overrides,
  }
}

export function buildMarmitariaPayload(overrides: Record<string, unknown> = {}) {
  const tag = uid('marm')
  return {
    name: `Marmiteiro ${tag}`,
    email: `${tag}${TEST_EMAIL_DOMAIN}`,
    password: 'Senha@Segura123',
    phone: '+5511999990003',
    document: '44.555.666/0001-22',
    tradeName: `Marmitaria ${tag}`,
    pricePerMeal: 15.00,
    termsAccepted: true,
    privacyAccepted: true,
    ...overrides,
  }
}

export function buildONGPayload(overrides: Record<string, unknown> = {}) {
  const tag = uid('ong')
  return {
    name: `ONG ${tag}`,
    email: `${tag}${TEST_EMAIL_DOMAIN}`,
    password: 'Senha@Segura123',
    phone: '+5511999990004',
    document: '77.888.999/0001-63',
    registrationNo: `ONG-${tag}`,
    termsAccepted: true,
    privacyAccepted: true,
    ...overrides,
  }
}

export function buildReceptorPayload(overrides: Record<string, unknown> = {}) {
  const tag = uid('receptor')
  return {
    email: `${tag}${TEST_EMAIL_DOMAIN}`,
    password: 'Senha@Segura123',
    termsAccepted: true,
    privacyAccepted: true,
    ...overrides,
  }
}

export function buildSponsorPayload(overrides: Record<string, unknown> = {}) {
  const tag = uid('sponsor')
  return {
    name: `Patrocinador ${tag}`,
    email: `${tag}${TEST_EMAIL_DOMAIN}`,
    password: 'Senha@Segura123',
    phone: '+5511999990005',
    termsAccepted: true,
    privacyAccepted: true,
    ...overrides,
  }
}

export function buildAddressPayload(overrides: Record<string, unknown> = {}) {
  return {
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 4',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01310-100',
    ...overrides,
  }
}

export function buildPushTokenPayload(overrides: Record<string, unknown> = {}) {
  const tag = uid('device')
  return {
    token: `ExponentPushToken[${tag}]`,
    deviceId: tag,
    platform: 'android',
    ...overrides,
  }
}
