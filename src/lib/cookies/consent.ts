/**
 * LGPD Cookie Consent — armazenamento e leitura no client.
 * @see intake-review/TASK-5/ST001 — CL-279
 */

export type ConsentCategories = {
  essential: true
  analytics: boolean
  marketing: boolean
}

export type Consent = {
  categories: ConsentCategories
  version: string
  at: string
}

const COOKIE_NAME = 'ps_cookie_consent'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 dias
export const CONSENT_VERSION = 'v1'
export const CONSENT_CHANGED_EVENT = 'cookieConsentChanged'

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function getConsent(): Consent | null {
  if (!isBrowser()) return null
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match.split('=')[1])) as Consent
  } catch {
    return null
  }
}

export function hasDecided(): boolean {
  return getConsent() !== null
}

export function setConsent(consent: Consent): void {
  if (!isBrowser()) return
  const value = encodeURIComponent(JSON.stringify(consent))
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: consent }))
}

export function revoke(): void {
  if (!isBrowser()) return
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: null }))
}

export function acceptAll(): Consent {
  const c: Consent = {
    categories: { essential: true, analytics: true, marketing: true },
    version: CONSENT_VERSION,
    at: new Date().toISOString(),
  }
  setConsent(c)
  return c
}

export function rejectOptional(): Consent {
  const c: Consent = {
    categories: { essential: true, analytics: false, marketing: false },
    version: CONSENT_VERSION,
    at: new Date().toISOString(),
  }
  setConsent(c)
  return c
}
